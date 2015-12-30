

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

var lawyerRegister = function(req, res, next){
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
    if(!lawyer.lawyerId) err            = '律师ID不能为空';
    if(!lawyer.identityNumber)err	    = '身份证号码不能为空';
    if(!validator.authId(lawyer.identityNumber)) err = '身份证号码格式错误';
    if(err) return res.send({rtn: 1, code: 1, message: err});


    async.waterfall([
        function(cb){
            if(config.switchPhoneVerifyCodeOff) return cb(null);
            if(!lawyer.verifyCode) return res.send({rtn: 1, message:'验证码不能为空'});
            redisClient.get([config.redisPrefix.verifyCode, lawyer.phoneNumber].join(':'), function(err, result){
                if(err) return cb(err);
                if(lawyer.verifyCode != result) return cb('验证码错误');
                return cb(null);
            });
        },
        function(cb){
            //auth post data
            Lawyer.getLawyerByCondition({email: lawyer.email}, cb);
        },
        function(docs, cb){
            if(docs) return cb({rtn: 1, message:'邮箱已经被注册'});
            Lawyer.getLawyerByCondition({phoneNumber: lawyer.phoneNumber}, cb);
        },
        function(docs, cb){
            if(docs) return cb({rtn: 1, message:'手机号码已经被注册'});
            Lawyer.getLawyerByCondition({identityNumber: lawyer.identityNumber}, cb);
        },
        function(docs, cb){
            if(docs) return cb({rtn: 1, message:'身份证号码已经被注册'});
            Lawyer.getLawyerByCondition({lawyerId: lawyer.lawyerId}, cb);
        },
        function(docs, cb){
            if(docs) return cb({rtn: 1, message:'律师执业证号已经被注册'});
            lawyer.password = secure.sha1(lawyer.password, 'utf-8', 'hex');
            Lawyer.createLawyer(lawyer, cb);
        }
    ], function(err, docs){
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


var createTestUser = function(role){

    return function(req, res, next){
        var openId = uuid.v1();
        res.cookie('openId', openId, {maxAge: 24 * 3600 * 1000, signed: true});
        res.cookie('role', role, {maxAge: 24 * 3600 * 1000, signed: true});

        var nameList = ["马旭", "马振川", "王万宾", "王小珂", "王文京", "王尔乘", "王全", "王安顺", "王岐山", "王青海", "王炳深", "王晓初", "王铮", "王蓉蓉", "巨晓林", "方新", "邓中翰", "冯乐平", "朱良玉", "朱惠刚", "刘忠军", "刘晓晨", "刘新成", "闫傲霜", "池强", "苏辉", "杜德印", "李士祥", "李大进", "李昭玲", "李超钢", "杨晓超", "吴正宪", "吴世雄", "吴碧霞", "怀进鹏", "张大勇", "张和平", "陈立国", "陈吉宁", "陈雨露", "欧阳泽华", "欧阳淞", "周其凤", "周毅"];
        var name = _.sample(nameList);

        var mongo = require('../clients/mongo.js');
        mongo.collection(role).update({"openId": openId}, {
            "openId": openId,
            "name":name,
            "openInfo": {
                "openid": openId,
                "nickname": name,
                "sex": 1,
                "language": "zh_CN",
                "city": "海淀",
                "province": "北京",
                "country": "中国",
                "headimgurl": "http://wx.qlogo.cn/mmopen/ccvPic0PMFqLM9ibzZWJLsTwuzTMc1nGbjwpZmOgOaPdfQAIRduhWXndtgwDZRuZusCTTPnToqVibibZmZWfzQoy6hcibgicDJbKVl/0",
                "privilege": [],
                "unionid": "op3Elt65DCYlvfpwiBk8zJJuwSXk"
            },
            "createdAt": new Date(),
            "updatedAt": new Date()
        }, {upsert:true});

        res.send({rtn:0, data:{openId:openId, role:role}});
    }
};

router.get('/givemeauser', createTestUser('users'));
router.get('/givemealawyer', createTestUser('lawyers'));


//the error handler
router.use(function(err, req, res, next){
    if(err){
        console.error(err);
        res.send({rtn:config.errorCode.unknownError, message:err});
    }
});

module.exports = router;