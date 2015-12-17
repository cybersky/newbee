

var express = require('express');
var router  = express.Router();
var Lawyer  = require('../odm/lawyer');
var async   = require('async');
var _   = require('lodash');
var validator   =require('validator');
var secure  = require('../tools/secret');
var middleware  = require('../middleware/uploader');
var request = require('request');
var redisClient   = require('../clients/redis').client;
var config  = require('../profile/config');
var utils   = require('../tools/utils');
var uuid = require('node-uuid');

validator.authId = function(id){
    if(!id) return false;
    var re = new RegExp(/^[1-9]\d{16}[\d|x|X]$/g);
    return re.test(id);
};

var lawyerRegister = (req, res, next) => {
    var files = req.files || {};
    if(!files['lawyerIdImage']) return res.send({rtn: 1, code: 1 , message: 'Missing lawyer id image'});
    if(!files['identityImage']) return res.send({rtn: 1, code: 1 , message: 'Missing identity image'});

    var lawyer = {};
    lawyer.username 		= _.trim(req.body['username'])  		|| '';
    lawyer.password 		= _.trim(req.body['password'])  		|| '';
    lawyer.email	  		= _.trim(req.body['email'])				|| '';
    lawyer.phoneNumber	    = _.trim(req.body['phoneNumber'])       || '';
    lawyer.verifyCode       = _.trim(req.body['verifyCode'])        || '';
    lawyer.identityNumber   = _.trim(req.body['identityNumber'])    || '';
    lawyer.identityFilename = '/upload/' + files.identityImage[0].filename;
    lawyer.lawyerIdFilename = '/upload/' + files.lawyerIdImage[0].filename;
    lawyer.lawyerId         = _.trim(req.body['lawyerId'])          || '';
    lawyer.lawyerLocation   = _.trim(req.body['lawyerLocation']);
    lawyer.lawServiceArea   = _.trim(req.body['lawServiceArea']);


    var err = '';
    if(!lawyer.username) err			= '用户名不能为空';
    if(!lawyer.password) err			= '密码不能为空';
    if(!lawyer.email)	   err			= '邮箱不能为空';
    if(!validator.isEmail(lawyer.email)) err = '邮箱格式错误';
    if(!lawyer.phoneNumber)err		    = '手机号码不能为空';
    if(!/\d{11}/.test(lawyer.phoneNumber)) err = '手机号码格式错误';
    if(!lawyer.verifyCode) err          = '验证码不能为空';
    if(!lawyer.lawyerId) err            = '律师ID不能为空';
    if(!lawyer.identityNumber)err	    = '身份证号码不能为空';
    if(!validator.authId(lawyer.identityNumber)) err = '身份证号码格式错误';
    if(err) return res.send({rtn: 1, code: 1, message: err});


    async.waterfall([
        (cb) => {
            redisClient.get([config.redisPrefix.verifyCode, lawyer.phoneNumber].join(':'), (err, result) => {
                if(err) return cb(err);
                if(lawyer.verifyCode != result) return cb('验证码错误');
                return cb(null);
            });
        },
        (cb) => {
            //auth post data
            Lawyer.getLawyerByCondition({email: lawyer.email}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'邮箱已经被注册'});
            Lawyer.getLawyerByCondition({phoneNumber: lawyer.phoneNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'手机号码已经被注册'});
            Lawyer.getLawyerByCondition({identityNumber: lawyer.identityNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'身份证号码已经被注册'});
            Lawyer.getLawyerByCondition({lawyerId: lawyer.lawyerId}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'律师执业证号已经被注册'});
            lawyer.password = secure.sha1(lawyer.password, 'utf-8');
            Lawyer.createLawyer(lawyer, cb);
        }
    ], (err, docs) => {
        if(err) return res.send({rtn: 1, message: err});
        res.send({rtn: 0, code:0, message:'Create Lawyer successful', data: docs});
    });
};

var getOneLawyer = function(req, res, next){
    var LawyerId = _.trim(req.params['lawyerId']) || '';
    if(!LawyerId) return res.send({rtn: 1, message:'Missing param LawyerId'});

    Lawyer.getOneLawyer(LawyerId, function(err, docs){
        if(err) return res.send({rtn: 1, message:err});
        res.send({rtn: 0, message: '', data: docs});
    });
};
var updateLawyer = function(req, res, next){};
var deleteLawyer = function(req, res, next){};


var lawyerSignin = (req, res, next) => {
    var email = req.body['email'] || '';
    var pass  = req.body['password'] || '';

    if(!email) return res.send({rtn: 1, code: 1, message: 'Email can not be empty'});
    if(!validator.isEmail(email)) return res.send({rtn: 1, code: 1, message:'Email format error'});
    if(!pass)  return res.send({rtn: 1, code: 1, message: 'Password can not be empty'});

    async.waterfall([
        (cb) => {
            Lawyer.getLawyerByCondition({email: email}, cb);
        },
        (docs, cb) => {
            if(!docs) return cb({rtn: 1, code: 1,notice:'emailNotice' ,message: 'The Email you typed do not matched'});
            if(secure.sha1(pass, 'utf-8') != docs.password) {
                return cb({rtn: 1, code: 1, notice: 'passwordNotice', message: 'The password you typed do not matched, Please try again'});
            }
            cb(null, docs);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        //login success and distributing the cookie
        //var token = secure.md5(email+config.cookie.privateKey);
        //String(Date.now())+':'+email+':'+docs._id+':'+token
        var token = secure.md5(email+config.cookieConfig.privateKey);
        res.cookie(config.cookieConfig.name, String(Date.now())+':'+email+':'+docs._id+':'+token, config.cookieConfig.options);
        return res.send({ rtn: 0, message: 'OK', refer: '/'});
    });

};

var handleLawyerVoiceCode = function(req, res, next){
    utils.handleMobileVoice(req.body.mobile, function(err){
        if(err) return res.send({rtn: 1, message: err});
        res.send({rtn:0});
    });
};

var handleVoiceCode = function(req, res, next){
    var openId = req.signedCookies.openId;
    if( !openId ) return res.send({rtn:config.errorCode.serviceError, message:'require openId'});

    utils.handleMobileVoice(req.body.mobile, function(err){
        if(err) return res.send({rtn: 1, message: err});
        res.send({rtn:0});
    });
};

var handleSMSCode = function(req, res, next){

};


//router.get('/lawyer', getLawyers);
router.get('/lawyer/:lawyerId', getOneLawyer);
router.put('/lawyer/:lawyerId', updateLawyer);
router.delete('/lawyer/:lawyerId', deleteLawyer);
router.post('/lawyer/voicecode', handleLawyerVoiceCode);

router.post('/signin', lawyerSignin);
router.post('/signup', middleware.uploader(['lawyerIdImage', 'identityImage']) , lawyerRegister);


router.post('/smscode', handleSMSCode);
router.post('/voicecode', handleVoiceCode);

router.get('/gettestopenid', function(req, res, next){
    if(!req.signedCookies.openId){
        res.cookie('openId', uuid.v1(), {maxAge: 24 * 3600 * 1000, signed: true});
    }
    res.send();
});


//the error handler
router.use(function(err, req, res, next){
    if(err){
        console.error(err);
        res.send({rtn:config.errorCode.unknownError, message:err});
    }
});

module.exports = router;