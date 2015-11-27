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


var bindUserMobile = function(req, res, next){

    var openId = req.signedCookies.openId;
    if( !openId ) return res.send({rtn:config.errorCode.serviceError, message:'require openId'});

    var mobile = req.body.mobile;
    var verifyCode = req.body.code;

    if(!/^\d{11}$/.test(mobile)) return next({rtn:config.errorCode.paramError, message:'invalid mobile number'});
    if(!/^\d{4}$/.test(verifyCode)) return next({rtn:config.errorCode.paramError, message:'invalid code'});

    var k = [config.redisPrefix.verifyCode, mobile].join(':');

    redis.client.get(k, function(err, code){
        if(err) return next(err);

        if(!config.skipConfirmCode && code != verifyCode) return res.send({rtn:config.errorCode.serviceError, message:'no such code'});

        console.log('mobile', mobile, 'verify ok');
        var user = mongo.db.collection('users');

        user.findAndModify({openId:openId}, [], {$set:{mobile:mobile}}, {new:true,upsert:true }, function(err, result){
            if(err) return next(err);
            console.log('insert into user', result);
            var id = result.value._id.toString();
            res.cookie('userId', id, {maxAge:3600*1000, signed:true});
            res.send({rtn:0});
        });
    });
};
router.post('/user/bindmobile', bindUserMobile);



module.exports = router;
