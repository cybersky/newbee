var express = require('express');
var router = express.Router();
var Lawyer = require('../odm/lawyer');
var async = require('async');
var _ = require('lodash');
var validator = require('validator');
var auth = require('../middleware/auth.js');
var m = require('moment');
var request = require('request');
var redis = require('../clients/redis');
var config = require('../profile/config');
var mongo = require('../clients/mongo');
var locale = require('../profile/locales.js');
var utils = require('../tools/utils.js');
var caseModel = require('../odm/case.js');

router.use(auth.authAPIOpenId());


var bindUserMobile = function (req, res, next) {

    var openId = req.signedCookies.openId;

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
    var userCase = _.pick(req.body, ['caseType', 'serviceType', 'caseDesc', 'caseTarget', 'price1', 'price2', 'lon', 'lat']);
    userCase.userOpenId = openId;

    async.waterfall([
        function (cb) {
            if (userCase.lon && userCase.lat) return cb(null, {lon: userCase.lon, lat: userCase.lat});
            utils.getLocation(openId, 'user', cb);
        },
        function (loc, cb) {
            if (loc && loc.lon && loc.lat) {
                userCase.location = {type: "Point", coordinates: [loc.lon, loc.lat]};
            }
            caseModel.createCase(userCase, cb);
        },
        function (result) {
            var id = result.insertedId.toString();
            res.send({rtn: 0, data: {id: id}});
        }
    ], next);

};

var getUserCases = function (req, res, next) {
    var openId = req.wxOpenId;

    caseModel.getCase({userOpenId: openId}, {sort:{createdAt: -1, updatedAt: -1}}, function(err, result){
        if (err) return next(err);
        res.send({rtn: 0, data: result});
    });


};

var updateCase = function (req, res, next) {
    var openId = req.wxOpenId;
    var caseId = req.params['caseId'];
    var userCase = _.pick(req.body, ['caseType', 'serviceType', 'caseDesc', 'caseTarget', 'price1', 'price2']);

    if (userCase.price1 && userCase.price1)
        return next({rtn: config.errorCode.paramError, message: 'either price1 or price2'});

    var updateDoc = {};
    if (userCase.price1) updateDoc.price1 = userCase.price1;
    if (userCase.price2) updateDoc.price2 = userCase.price2;
    if (userCase.caseDesc) updateDoc.caseDesc = userCase.caseDesc;
    if (userCase.caseTarget) updateDoc.caseTarget = userCase.caseTarget;

    caseModel.updateCase(caseId, updateDoc, function () {
        if (err) return next(err);
        if (result && result.nModified == 1) {
            res.send({rtn: 0});
        }
    });

};


var getLawyerCases = function (req, res, next) {
    var sort = 'updated', page = 0, pageLength = 10, sortDoc;

    if (req.query.sort && ['updated', 'geo', 'price'].indexOf(req.query.sort) > 0) {
        sort = req.query.sort;
    }

    if (req.query.page && !isNaN(Number(req.query.page))) {
        page = req.query.page;
    }
    switch (sort) {
        case 'updated':
            sortDoc = {updatedAt: -1, price1: -1};
            break;
        case 'geo':
            sortDoc = null;
            break;
        case 'price':
            sortDoc = {price1: -1, updatedAt: -1};
            break;
    }

    var query = {status: {$in: [config.caseStatus.RAW.key, config.caseStatus.BID.key]}};

    async.waterfall([
        function (cb) {
            if (sort != 'geo') return cb(null, null);
            utils.getLocation(req.wxOpenId, 'lawyer', cb);
        },
        function (loc, cb) {
            if (sort == 'geo') {
                if (!loc || !loc.lon || !loc.lat) return cb({
                    rtn: config.errorCode.paramError,
                    message: 'can not location lawyer'
                });

                query['location'] = {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [loc.lon, loc.lat]
                        },
                        $maxDistance: 10 * 1000
                    }
                }
            }

            caseModel.getCase(query, {sort: sortDoc, limit: pageLength, skip: page * pageLength}, function (err, docs) {
                res.send({rtn: 0, data: docs});
            });

        }

    ], next);

};


var getJSSDKConfig = function (option) {

    return function (req, res, next) {
        var url = req.get('referrer') || config.wxPageHost + req.originalUrl;

        utils.getJSAPIConfig(option, url, function (err, config) {
            if (err) return next(err);
            var jssdkConfig = config;

            //jssdkConfig.debug = true;
            jssdkConfig.jsApiList = [
                'openLocation',
                'getLocation',
                'chooseImage',
                'previewImage',
                'uploadImage',
                'downloadImage',
                'getNetworkType'];

            res.send({rtn: 0, data: {config: jssdkConfig}});
        });
    };

};


router.post('/user/bindmobile', bindUserMobile);

router.post('/user/cases', createCase);

router.get('/user/cases', getUserCases);

router.post('/user/cases/:caseId', updateCase);

router.get('/ly/cases', getLawyerCases);

router.get('/user/jsconfig', getJSSDKConfig(config.optionsUser));

router.get('/ly/jsconfig', getJSSDKConfig(config.optionsLawyer));


//the error handler
router.use(function (err, req, res, next) {
    console.error('private api error:', err);
    console.error('message', err.message );
    console.error('stack', err.stack);
    res.send({rtn: err.rtn || config.errorCode.unknownError, message: err.message || err.toString() });
});

module.exports = router;
