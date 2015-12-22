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



var adminLogin = function(req, res, next) {
    var email = req.body['email'] || '';
    var pass  = req.body['password'] || '';

    if(!email) return res.send({rtn: 1, code: 1, message: 'Email can not be empty'});
    if(!validator.isEmail(email)) return res.send({rtn: 1, code: 1, message:'Email format error'});
    if(!pass)  return res.send({rtn: 1, code: 1, message: 'Password can not be empty'});

    async.waterfall([
        function(cb){
            Operator.getOperatorByCondition({email: email}, cb);
        },
        function(docs, cb){
            if(!docs) return cb({rtn: 1, code: 1, notice:'emailNotice' ,message: 'The Email you typed do not matched'});
            if(secure.sha1(pass, 'utf-8') != docs.password) {
                return cb({rtn: 1, code: 1, notice: 'passwordNotice', message: 'The password you typed do not matched, Please try again'});
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
            Lawyer.lawyerCount(cb);
        },
        function(count, cb){
            ct = count;
            Lawyer.getLawyers(start, rows, cb);
        }
    ], function(err, docs){
        if(err) return res.send(err);
        res.send({rtn: 0, message: '', total: ct, data: docs});
    });
};

router.get('/lawyer', auth.authOperatorCookie, getLawyers);

var getLawyer = function(req, res, next){
    var lawyerId = req.params['lawyerId'];
    if(!lawyerId) return res.send({rtn: config.errorCode.paramError, message: 'lawyer id can not be empty'});
    Lawyer.getOneLawyer(lawyerId, function(err, doc){
        if(err) return res.send({rtn: 1, message: err});
        if(doc._doc.password) delete doc._doc.password;
        return res.send({rtn: 0, message: '', data: doc});
    });
};
router.get('/lawyer/:lawyerId', auth.authOperatorCookie, getLawyer);
// ============================= lawyer CRUD end================================



// ============================= operator CRUD start============================
var getOperator = function(req, res, next){
    var operatorId = req.params['operatorId'];
    if(!operatorId) return res.send({rtn: 1, code: 1, message: 'Invalid operator id'});

    return Operator.getOperatorById(operatorId, function(err, doc){
        if(err) return res.send({rtn: 1, code: 1, message: err});
        if(doc._doc.password) delete doc._doc.password;
        return res.send({rtn: 0, code: 0, message: 'ok', data: doc});
    });

};
router.get('/operator/:operatorId', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, getOperator);

var getOperators = function(req, res, next){
    var start = req.query['start'] || 0;
    var rows  = req.query['rows']  || 10;

    return Operator.getOperators(start, rows, function(err, docs){
        if(err) return res.send({rtn: 1, code: 1, message: err});
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
    if(password != cpt) err = 'The password is not matched with confirm password';
    if(!username)       err = 'The username can not be empty';
    if(!email)          err = 'The email can not be empty';
    if(!level)          err = 'The level can not be empty';
    if(!validator.isEmail(email)) err = 'The email format error';
    if(err) return res.send({rtn: 1, code: 1, message: config.errorCode.paramError});

    var operatorInfo = {
        username: username, email: email, level: level,
        password: secure.sha1(password, 'utf8', 'hex')
    };

    var callback = function(err, results){
        if(err) return res.send({rtn: 1, code: 1, message: err});
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
    if(!operatorId) err = '用户ID不能为空';
    if(password != cpassword) err = '两次密码不匹配';
    if(!username) err = '用户名不能为空';
    if(!email) err = '邮箱不能为空';
    if(!validator.isEmail(email)) err = '邮箱格式不合法';
    if(!level || isNaN(level)) err = '非法用户等级';
    if(err) return res.send({rtn: config.errorCode.paramError, code: 1, message: err});

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
        if(err) return res.send({rtn: 1, code: 1, message: err});
        return res.send({rtn: 0, message: 'ok', data: result});
    });

};
router.put('/operator/:operatorId', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, updateOperator);

var removeOperator = function(req, res, next){
    var operatorId = req.params['operatorId'];
    if(!operatorId) return res.send({rtn: 1, code: 1, message: 'Invalid Operator Id'});

    if(operatorId == req.adminInfo._id) return res.send({rtn:1 , code: 1, message: '无法将自己删除'});

    return Operator.removeOperator(operatorId, function(err, docs){
        if(err) return res.send({rtn: 1, code: 1, message: err});
        return res.send({rtn: 0, message: 'ok', data: docs});
    });
};
router.delete('/operator/:operatorId', auth.authOperatorCookie, auth.prepareAdminInfo, auth.authOperatorLevel, removeOperator);
// ============================= operator CRUD end ============================


// ============================= case CRUD start ==============================
var getCase = function(req, res, next){};
var getCases = function(req, res, next){
    var start = req.query['start'] || 0;
    var rows = req.query['rows'] || 10;

    var state = 'raw';//initially state case

    return Case.getCaseByStatus(state, {skin: start, limit: rows}, function(err, cases){
        if(err) return res.send({rtn: 1, code: 1, message: err});
        return res.send({rtn: 0, message: 'ok', data: cases});
    });
};
router.get('/cases', auth.authOperatorCookie, auth.prepareAdminInfo, getCases);
//var getCases = function(req, res, next){};
//var getCases = function(req, res, next){};

// ============================= case CRUD end ================================


module.exports = router;