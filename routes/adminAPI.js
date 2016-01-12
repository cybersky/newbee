/**
 * Created by Daniels on 10/28/15.
 */
var express = require('express');
var router = express.Router();
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secret');
var Operator = require('../odm/admin/operator');
var Lawyer = require('../odm/admin/lawyer');
var config  = require('../profile/config');
var auth   = require('../middleware/auth');
var Case    = require('../odm/case');
var locales = require('../profile/locales');


var adminLogin = function(req, res, next) {
    var email = req.body['email'] || '';
    var pass  = req.body['password'] || '';

    if(!email) return res.send({rtn: 1, code: 1, message: locales.email.empty});
    if(!validator.isEmail(email)) return res.send({rtn: 1, code: 1, message:locales.email.formatError});
    if(!pass)  return res.send({rtn: 1, code: 1, message: locales.password.empty});

    async.waterfall([
        function(cb){
            Operator.getOperatorByCondition({email: email}, cb);
        },
        function(docs, cb){
            if(!docs) return cb({rtn: 1, code: 1, notice:'emailNotice' ,message: locales.email.notMatched});
            if(secure.sha1(pass, 'utf-8') != docs.password) {
                return cb({rtn: 1, code: 1, notice: 'passwordNotice', message: locales.password.mistookPwd});
            }
            cb(null, docs);
        }
    ], function(err, docs) {
        if(err) return res.send(err);
        var token = secure.md5(email+config.operatorCookie.privateKey);
        res.cookie(config.operatorCookie.name, String(Date.now())+':'+email+':'+docs._id+':'+token, config.operatorCookie.options);
        return res.send({ rtn: 0, message: 'OK', refer: '/ap/manager'});
    });
};
router.post('/signin', adminLogin);



// ============================= lawyer CRUD start================================

var getLawyers  = function(req, res, next){
    var start = req.query['start'] || 0;
    var rows = req.query['rows'] || 10;

    var ct = '';
    async.waterfall([
        function(cb){
            Lawyer.lawyerCount({status: config.lawyerStatus.subscribe.key},cb);
        },
        function(count, cb){
            ct = count;
            Lawyer.getLawyers(start, rows, {status: config.lawyerStatus.subscribe.key}, cb);
        }
    ], function(err, docs){
        if(err) return res.send(err);
        if(docs.length > 0){
            _.map(docs, function(doc){
                var resp = [];
                var types = doc.lawServiceArea.split(',');
                types.forEach(function(type){
                    resp.push(_.find(config.userCaseType, {name: type}).label);
                });
                doc._doc.lawServiceArea = resp.join(',');
            });
        }
        res.send({rtn: 0, message: '', total: ct, data: docs});
    });
};

router.get('/lawyer', auth.authOperatorCookie, auth.prepareAdminInfo, getLawyers);

var getLawyer = function(req, res, next){
    var lawyerId = req.params['lawyerId'];
    if(!lawyerId) return res.send({rtn: config.errorCode.paramError, message: locales.lawyer.emptyId});
    Lawyer.getOneLawyer(lawyerId, function(err, doc){
        if(err) return res.send({rtn: 1, message: err});
        if(doc._doc.password) delete doc._doc.password;
        var types = doc.lawServiceArea.split(',');
        var resp = [];
        types.forEach(function(type){
            resp.push(_.find(config.userCaseType, {name: type}).label);
        });
        doc.lawServiceArea = resp.join(',');
        return res.send({rtn: 0, message: '', data: doc});
    });
};
router.get('/lawyer/:lawyerId', auth.authOperatorCookie, auth.prepareAdminInfo, getLawyer);


var updateLawyer = function(req, res, next){
    var lawyerId = req.params['lawyerId'];
    if(!lawyerId) return res.send({rtn: config.errorCode.paramError, message: locales.lawyer.emptyId});

    var data = {}, action = req.body['action'];
    if(action == config.lawyerStatus.reject.key){
        data.status = config.lawyerStatus.reject.key;
        var reason = req.body['reason'];
        if(!reason) return res.send({rtn: config.errorCode.paramError, message: locales.lawyer.rejectMsgEmpty});
        data.message = reason;
    }else if (action == config.lawyerStatus.ok.key){
        data.status = config.lawyerStatus.ok.key;
    }else{
        //this is non-normally action, unless the request send from non-browser
        return res.send({rtn: config.errorCode.paramError, message: '无效关键词, 您的操作异常'});
    }

    return Lawyer.updateLawyer(lawyerId, data, function(err, result){
        if(err) return res.send({rtn: 1, message: err});
        return res.send({rtn:0, message:'ok', data: result});
    });

};
router.put('/lawyer/:lawyerId', auth.authOperatorCookie, auth.prepareAdminInfo, updateLawyer);
// ============================= lawyer CRUD end================================



// ============================= operator CRUD start============================
var getOperator = function(req, res, next){
    var operatorId = req.params['operatorId'];
    if(!operatorId) return res.send({rtn: config.errorCode.paramError, message: locales.operator.emptyId});

    return Operator.getOperatorById(operatorId, function(err, doc){
        if(err) return res.send({rtn: 1, message: err});
        if(doc._doc.password) delete doc._doc.password;
        return res.send({rtn: 0, code: 0, message: 'ok', data: doc});
    });

};
router.get('/operator/:operatorId', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, getOperator);

var getOperators = function(req, res, next){
    var start = req.query['start'] || 0;
    var rows  = req.query['rows']  || 10;

    return Operator.getOperators(start, rows, function(err, docs){
        if(err) return res.send({rtn: 1, message: err});
        return res.send({rtn: 0, message: 'ok', data: docs});
    });
};
router.get('/operators', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, getOperators);

var createOperator = function(req, res, next){
    var username    = _.trim(req.body['username']);
    var email       = _.trim(req.body['email']).toLowerCase();
    var level       = _.trim(req.body['level']);
    var password    = _.trim(req.body['password']);
    var cpt         = _.trim(req.body['cpassword']);

    var err;
    if(password != cpt) err = locales.password.notMatched;
    if(!username)       err = locales.operator.usernameEmpty;
    if(!email)          err = locales.email.empty;
    if(!level)          err = locales.operator.levelEmpty;
    if(!validator.isEmail(email)) err = locales.email.formatError;
    if(err) return res.send({rtn: config.errorCode.paramError, message: err});

    var operatorInfo = {
        username: username, email: email, level: level,
        password: secure.sha1(password, 'utf8', 'hex')
    };

    var callback = function(err, results){
        if(err) return res.send({rtn: 1, message: err});
        res.send({rtn: 0, message: 'ok', data: results});
    };
    return Operator.createOperator(operatorInfo,  callback);
};
router.post('/operator', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, createOperator);

var updateOperator = function(req, res, next){
    var operatorId = req.params['operatorId'];
    var username = req.body['username'];
    var email = req.body['email'];
    var password = req.body['password'];
    var cpassword = req.body['cpd'];
    var level = req.body['level'];

    var err;
    if(!operatorId) err = locales.operator.emptyId;
    if(password != cpassword) err = locales.password.notMatched;
    if(!username) err = locales.operator.usernameEmpty;
    if(!email) err = locales.email.empty;
    if(!validator.isEmail(email)) err = locales.email.formatError;
    if(!level || isNaN(level)) err = locales.operator.illegalLevel;
    if(err) return res.send({rtn: config.errorCode.paramError, message: err});

    var data = {};
    async.waterfall([
        function(cb){
            Operator.getOperatorById(operatorId, cb);
        },
        function(doc, cb){
            var psd = secure.sha1(password, 'utf8', 'hex');
            if(psd){
                if(doc.password != psd) data.password = psd;
            }
            if(doc.username != username) data.username = username;
            if(doc.email != email) data.email = email;
            if(doc.level != level) data.level = level;
            return cb(null);
        },
        function(cb){
            return Operator.updateOperator(operatorId, data, cb);
        }
    ], function(err, result){
        if(err) return res.send({rtn: 1, message: err});
        return res.send({rtn: 0, message: 'ok', data: result});
    });

};
router.put('/operator/:operatorId', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, updateOperator);

var removeOperator = function(req, res, next){
    var operatorId = req.params['operatorId'];
    if(!operatorId) return res.send({rtn: config.errorCode.paramError, message: locales.operator.emptyId});

    if(operatorId == req.adminInfo._id)
        return res.send({rtn:config.errorCode.paramError, message: locales.operator.illegalOperation});

    return Operator.removeOperator(operatorId, function(err, docs){
        if(err) return res.send({rtn: 1, message: err});
        return res.send({rtn: 0, message: 'ok', data: docs});
    });
};
router.delete('/operator/:operatorId', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, removeOperator);
// ============================= operator CRUD end ============================


// ============================= case CRUD start ==============================

var getCases = function(req, res, next){
    var start = req.query['start'] || 0;
    var rows = req.query['rows'] || 10;

    var total;
    async.waterfall([
        function(cb){
            Case.countCaseByStatus(config.caseStatus.raw.key, cb);
        },
        function(count, cb){
            total = count;
            Case.getCaseByStatus(config.caseStatus.raw.key, {skip: start, limit: rows}, cb);
        }
    ], function(err, cases){
        if(err) return res.send({rtn: 1, message: err});
        for(var i = 0, len = cases.length; i < len; i++){
            cases[i].caseType = _.findWhere(config.userCaseType, {name: cases[i].caseType}).label;
            cases[i].serviceType = _.findWhere(config.userServiceType, {name: cases[i].serviceType}).label;
        }
        return res.send({rtn: 0, message: 'ok',  total: total, data: cases});
    });
};
router.get('/cases', auth.authOperatorCookie, auth.prepareAdminInfo, getCases);

var updateCase = function(req, res, next){
    var caseId = req.params['caseId'];
    if(!caseId) return res.send({rtn: config.errorCode.paramError, message: locales.case.emptyId});

    var action = req.body['action'];
    if(!action) return res.send({rtn: config.errorCode.paramError, message: '无效关键词, 您的操作异常'});

    var rank = req.body['rank'];
    if(!rank || isNaN(rank)) return res.send({rtn: config.errorCode.paramError, message: '等级参数错误'});

    var data = {};
    data.rank = rank;
    if(action == config.caseStatus.reject.key){
        data.status =  config.caseStatus.reject.key;
        var reason = req.body['reason'];
        if(!reason) return res.send({rtn: config.errorCode.paramError, message: locales.case.rejectMsgEmpty});
        data.message = reason;
    }else if (action == config.caseStatus.online.key){
        data.status = config.caseStatus.online.key;
    }else{
        return res.send({rtn: config.errorCode.paramError, message: '无效关键词, 您的操作异常'});
    }

    return Case.updateOneCase(caseId, data, function(err, result){
        if(err) return res.send({rtn: 1, message: err });
        return res.send({rtn: 0, message: 'ok', data: result});
    });
};
router.put('/case/:caseId', auth.authOperatorCookie, auth.prepareAdminInfo, updateCase);


// ============================= case CRUD end ================================


module.exports = router;