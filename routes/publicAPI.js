

var express = require('express');
var router = express.Router();
var Lawyer	= require('../odm/lawyer');
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secret');
var middleware = require('../middleware/uploader');
var m = require('moment');
var request = require('request');
var redis = require('../clients/redis');
var config = require('../profile/config');
var mongo = require('../clients/mongo');


validator.authId = function(id){
    if(!id) return false;
    var re = new RegExp(/^[1-9]\d{16}[\d|x|X]$/g);
    return re.test(id);
};

var LawyerRegister = (req, res, next) => {
    var files = req.files || {};
    if(!files['lawyerIdImage']) return res.send({rtn: 1, code: 1 , message: 'Missing lawyer id image'});
    if(!files['identityImage']) return res.send({rtn: 1, code: 1 , message: 'Missing identity image'});
    var lawyer = {};
    lawyer.username 		= _.trim(req.body['username'])  		|| '';
    lawyer.password 		= _.trim(req.body['password'])  		|| '';
    lawyer.email	  		= _.trim(req.body['email'])				|| '';
    lawyer.phoneNumber	= _.trim(req.body['phoneNumber'])       || '';
    lawyer.identityNumber = _.trim(req.body['identityNumber'])    || '';
    lawyer.identityFilename = '/upload/' + files.identityImage[0].filename;
    lawyer.lawyerIdFilename = '/upload/' + files.lawyerIdImage[0].filename;
    lawyer.lawyerId       = _.trim(req.body['lawyerId'])          || '';
    lawyer.lawyerLocation = _.trim(req.body['lawyerLocation']);
    lawyer.lawServiceArea = _.trim(req.body['lawServiceArea']);


    var err = '';
    if(!lawyer.username) err			= '用户名不能为空';
    if(!lawyer.password) err			= '密码不能为空';
    if(!lawyer.email)	   err			= '邮箱不能为空';
    if(!validator.isEmail(lawyer.email)) err = '邮箱格式错误';
    if(!lawyer.phoneNumber)err		    = '手机号码不能为空';
    if(!validator.isMobilePhone(lawyer.phoneNumber, 'zh-CN')) err = '手机号码格式错误';
    if(!lawyer.lawyerId) err            = '律师ID不能为空';
    if(!lawyer.identityNumber)err	    = '身份证号码不能为空';
    if(!validator.authId(lawyer.identityNumber)) err = '身份证号码格式错误';
    if(err) return res.send({rtn: 1, code: 1, message: err});


    async.waterfall([
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
        if(err) return res.send(err);
        res.send({rtn: 0, code:0, message:'Create Lawyer successful', data: docs});
    });
};

var adminLogin = (req, res, next) => {
    var email = req.body['email'] || '';
    var pass  = req.body['password'] || '';

    if(!email) return res.send({rtn: 1, code: 1, message: 'Email can not be empty'});
    if(!validator.isEmail(email)) return res.send({rtn: 1, code: 1, message:'Email format error'});
    if(!pass)  return res.send({rtn: 1, code: 1, message: 'Password can not be empty'});

    async.waterfall([
        (cb) => {
            Operator.getOperatorByCondition({email: email}, cb);
        },
        (docs, cb) => {
            if(!docs) return cb({rtn: 1, code: 1, notice:'emailNotice' ,message: 'The Email you typed do not matched'});
            if(secure.sha1(pass, 'utf-8') != docs.password) {
                return cb({rtn: 1, code: 1, notice: 'passwordNotice', message: 'The password you typed do not matched, Please try again'});
            }
            cb(null, docs);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        var token = secure.md5(email+config.operatorCookie.privateKey);
        res.cookie(config.operatorCookie.name, String(Date.now())+':'+email+':'+docs._id+':'+token, config.operatorCookie.options);
        if(docs.password) delete docs._doc.password;

        req.session.adminInfo    = docs;
        return res.send({ rtn: 0, message: 'OK', refer: '/ap/manager'});
    });
};
router.post('/admin/signin', adminLogin);

router.post('/lawyer/signup', middleware.uploader(['lawyerIdImage', 'identityImage']) , LawyerRegister);



var handleVoiceCode = function(req, res, next){

    var mobile = req.body.mobile;
    var openId = req.body.openId;

    if(!/^\d{11}$/.test(mobile)) return next({rtn:config.errorCode.paramError, message:'invalid mobile number'});

    //APP ID
    var appId = config.ytxConfig.appId;
    //APP TOKEN
    var appToken = config.ytxConfig.appToken;

    //ACCOUNT SID：
    var accountId = config.ytxConfig.accountId;
    //AUTH TOKEN：
    var authToken = config.ytxConfig.authToken;

    var testHost = config.ytxConfig.testHost;
    var prodHost = config.ytxConfig.prodHost;
    var path = config.ytxConfig.path;

    var ts = m().format('YYYYMMDDHHmmss');
    var sig = secure.md5([accountId, authToken, ts].join(''), 'utf8', 'hex').toUpperCase();

    path = path.replace('{accountId}', accountId);
    path = path.replace('{sig}', sig);

    var auth = new Buffer([accountId, ts].join(':'), 'utf8').toString('base64');

    var verifyCode = String.prototype.substr.call(Math.random(), 2, 4);

    var option = {
        url:testHost + path,
        json:{appId:appId, verifyCode:verifyCode, playTimes:'2', to:mobile, displayNum:'777'},
        headers:{
            Authorization:auth
        }
    };
    request.post(option, function(err, resp, body){
        if(err) return next(err);

        if(body && body.statusCode == '000000' ){
            console.log('yunxtong ok, sent', option.json);

            var k = [config.redisPrefix.verifyCode, mobile].join(':');
            redis.client.setex(k, 90, verifyCode, function(err){
                if(err) return next(err);
            });
            res.send({rtn:0});
        }
        else{
            return next('invalid response:'+body);
        }

    });
};

var handleSMSCode = function(req, res, next){

};

var handleConfirmCode = function(req, res, next){
    var mobile = req.body.mobile;
    var openId = req.body.openId;
    var verifyCode = req.body.code;

    if(!/^\d{11}$/.test(mobile)) return next({rtn:config.errorCode.paramError, message:'invalid mobile number'});
    if(!/^\d{4}$/.test(verifyCode)) return next({rtn:config.errorCode.paramError, message:'invalid code'});

    var k = [config.redisPrefix.verifyCode, mobile].join(':');

    redis.client.get(k, function(err, code){
        if(err) return next(err);

        if(code && code == verifyCode){
            console.log('mobile', mobile, 'verify ok');

            var user = mongo.db.collection('users');
            user.update({mobile:mobile}, {openId:openId}, {upsert:true}, function(err){
                if(err) return next(err);
                console.log('insert into user');
                res.send({rtn:0});
            });
        }else{
            res.send({rtn:config.errorCode.serviceError, message:'no such code'});
        }
    });
};


router.post('/smscode', handleSMSCode);
router.post('/voicecode', handleVoiceCode);
router.post('/confirmcode', handleConfirmCode);

//the error handler
router.use(function(err, req, res, next){
    if(err){
        console.error(err);
        res.send({rtn:config.errorCode.unknownError, message:err});
    }
});

module.exports = router;