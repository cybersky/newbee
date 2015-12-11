var express = require('express');
var router = express.Router();
var Lawyer = require('../odm/lawyer');
var async = require('async');
var _ = require('lodash');
var validator = require('validator');
var secure = require('../tools/secret');
var middleware = require('../middleware/uploader');
var m = require('moment');
var request = require('request');
var redis = require('../clients/redis');
var config = require('../profile/config');
var mongo = require('../clients/mongo');


var bindUserMobile = function (req, res, next) {

    var openId = req.signedCookies.openId;
    if (!openId) return res.send({rtn: config.errorCode.serviceError, message: 'require openId'});

    var mobile = req.body.mobile;
    var verifyCode = req.body.code;

    if (!/^\d{11}$/.test(mobile)) return next({rtn: config.errorCode.paramError, message: 'invalid mobile number'});
    if (!/^\d{4}$/.test(verifyCode)) return next({rtn: config.errorCode.paramError, message: 'invalid code'});

    var k = [config.redisPrefix.verifyCode, mobile].join(':');

    redis.client.get(k, function (err, code) {
        if (err) return next(err);

        if (!config.skipConfirmCode && code != verifyCode) return res.send({
            rtn: config.errorCode.serviceError,
            message: '错误的验证码'
        });

        console.log('mobile', mobile, 'verify ok');
        var user = mongo.db.collection('users');

        user.findAndModify({openId: openId}, [], {$set: {mobile: mobile}}, {
            new: true,
            upsert: true
        }, function (err, result) {
            if (err && err.code == '11000') {
                return res.send({rtn: 1, message: '此手机号码已经被占用'});
            }
            if (err) return next(err);
            console.log('insert into user', result);
            var id = result.value._id.toString();
            res.cookie('userId', id, {maxAge: 3600 * 1000, signed: true});
            res.send({rtn: 0});
        });
    });
};


var createCase = function (req, res, next) {
    var openId = req.wxOpenId;
    var userCase = _.pick(req.body, ['caseType', 'serviceType', 'caseDesc', 'caseTarget', 'price1', 'price2']);

    if (_.pluck(config.userCaseType, 'name').indexOf(userCase.caseType) < 0)
        return next({rtn: config.errorCode.paramError, message: 'unknown caseType'});

    if (_.pluck(config.userServiceType, 'name').indexOf(userCase.serviceType) < 0)
        return next({rtn: config.errorCode.paramError, message: 'unknown serviceType'});

    if(!userCase.caseDesc || userCase.caseDesc.length < 20)
        return next({rtn: config.errorCode.paramError, message: 'caseDesc too short'});

    if(!userCase.caseTarget || userCase.caseTarget.length < 20)
        return next({rtn: config.errorCode.paramError, message: 'caseTarget too short'});

    if(userCase.price1 && userCase.price1)
        return next({rtn: config.errorCode.paramError, message: 'either price1 or price2'});

    if(isNaN(Number(userCase.price1)))
        return next({rtn: config.errorCode.paramError, message: 'price1 should be number'});

    if(isNaN(Number(userCase.price2)) || Number(userCase.price2) < 0 ||  Number(userCase.price2) > 100)
        return next({rtn: config.errorCode.paramError, message: 'price2 should be (0-100)'});


    userCase.status = config.caseStatus.RAW.key;
    userCase.userOpenId = openId;
    userCase.createdAt = new Date();
    userCase.updatedAt = new Date();

    var caseCollection = mongo.case();

    async.waterfall([
        function(cb){
            var rk = ['location', 'user', openId].join(":");
            redis.client.get(rk, cb);
        },
        function(loc, cb){
            if(loc && loc.lon && loc.lat) userCase.location = [loc.lon, loc.lat];
            caseCollection.insert(userCase, cb);
        },
        function(result, cb){
            res.send({rtn:0});
        }
    ], next);

};

var getUserCases = function(req, res, next){

};

var updateCase = function(req, res, next){

};


router.post('/user/bindmobile', bindUserMobile);

router.post('/user/cases', createCase);

router.get('/user/cases', getUserCases);

router.post('/user/cases/:caseId', updateCase);


module.exports = router;
