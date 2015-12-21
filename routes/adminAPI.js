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


var getOperator = function(req, res, next){};
//router.get('/operator');

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

var updateOperator = function(req, res, next){};
//router.post('/operator/:operatorId');

var removeOperator = function(req, res, next){};
//router.delete('/operator/:operatorId');

module.exports = router;