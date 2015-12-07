

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
var getLawyers   = function(req, res, next){
    var start = req.query['start'] || 0;
    var rows = req.query['rows'] || 10;

    var ct = '';
    async.waterfall([
        (cb) => {
            Lawyer.LawyerCount(cb);
        },
        (count, cb) => {
            ct = count;
            Lawyer.getLawyers(start, rows, cb);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        res.send({rtn: 0, message: '', total: ct, data: docs});
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





router.get('/lawyer', getLawyers);
router.get('/lawyer/:lawyerId', getOneLawyer);
router.put('/lawyer/update/:lawyerId', updateLawyer);
router.delete('/lawyer/delete/:lawyerId', deleteLawyer);
router.post('/lawyer/signup', middleware.uploader(['lawyerIdImage', 'identityImage']) , lawyerRegister);



var handleVoiceCode = function(req, res, next){
    var openId = req.signedCookies.openId;
    if( !openId ) return res.send({rtn:config.errorCode.serviceError, message:'require openId'});

    var mobile = req.body.mobile;

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


router.post('/smscode', handleSMSCode);
router.post('/voicecode', handleVoiceCode);




//the error handler
router.use(function(err, req, res, next){
    if(err){
        console.error(err);
        res.send({rtn:config.errorCode.unknownError, message:err});
    }
});

module.exports = router;