var express = require('express');
var router = express.Router();
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
var notification = require('../task/notification.js');

router.use(auth.authAPIOpenId());


var bindUserMobile = function (req, res, next) {

    var openId = req.signedCookies.openId;

    var name = req.body.name;
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

        user.findAndModify({openId: openId}, [],
                {$set: {mobile: mobile, name: name}},
                {new: true, upsert: true},

            function (err, result) {
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

    var userCase = _.pick(req.body, ['caseType', 'serviceType', 'caseDesc', 'caseTarget', 'price1', 'price2', 'lon', 'lat']);

    userCase.userOpenId = req.wxOpenId;
    userCase.userInfo = req.currentUser;

    async.waterfall([
        function (cb) {
            if(userCase.lon && userCase.lat){

                userCase.lon = Number(userCase.lon);
                userCase.lat = Number(userCase.lat);

                if(!isNaN(userCase.lon) && !isNaN(userCase.lat) ){
                    return cb(null, {lon: userCase.lon, lat: userCase.lat });
                }
            }
            utils.getLocation(req.wxOpenId, 'user', cb);
        },
        function (loc, cb) {
            if (loc && loc.lon && loc.lat) {
                userCase.location = {type: "Point", coordinates: [loc.lon, loc.lat]};
            }
            caseModel.createCase(userCase, cb);
        },
        function (id) {
            res.send({rtn: 0, data: {id: id}});
        }
    ], next);

};

var getUserCases = function (req, res, next) {
    var openId = req.wxOpenId;

    caseModel.getCase({userOpenId: openId}, {sort: {createdAt: -1, updatedAt: -1}}, function (err, result) {
        if (err) return next(err);
        res.send({rtn: 0, data: result});
    });

};

var cancelCaseByUser = function(req, res, next){
    var openId = req.wxOpenId;
    var caseId = req.params['caseId'];

    caseModel.cancelCaseByUser(caseId, openId, function (err) {
        if (err) return next(err);
        res.send({rtn: 0});

        notification.noticeStatus2Lawyer(caseId, config.caseStatus.cancel.key);
    });
};

var updateCaseByUser = function (req, res, next) {

    var openId = req.wxOpenId;
    var caseId = req.params['caseId'];
    var userCase = _.pick(req.body, ['caseType', 'serviceType', 'caseDesc', 'caseTarget', 'price1', 'price2']);


    caseModel.updateOneCaseByUser(caseId, openId, userCase, function (err) {
        if (err) return next(err);
        res.send({rtn: 0});

        notification.noticeEvent2Lawyer(caseId, config.caseEvent.change.key);
    });

};


var updateCaseStatus = function(req, res, next){
    var openId = req.wxOpenId;
    var caseId = req.params['caseId'];
    var status = req.body.status;

    switch (status){
        case config.caseStatus.target.key:
            var bidId = req.body.bidId;

            caseModel.targetCaseByUser(caseId, openId, bidId, function(err){
                if(err) return next(err);
                res.send({rtn: 0});
                notification.noticeStatus2Lawyer(caseId, config.caseStatus.target.key);
            });
            break;
        case config.caseStatus.closeu.key:
            caseModel.updateOneCaseByUser(caseId, openId, {status:config.caseStatus.closeu.key}, function(err){
                if(err) return next(err);
                res.send({rtn:0});
                notification.noticeStatus2Lawyer(caseId, config.caseStatus.closeu.key);
            });
            break;

        case config.caseStatus.disputeu.key:
            caseModel.updateOneCaseByUser(caseId, openId, {status:config.caseStatus.disputeu.key}, function(err){
                if(err) return next(err);
                res.send({rtn:0});

                notification.noticeStatus2Lawyer(caseId, config.caseStatus.disputeu.key);
                notification.noticeStatus2Lawyer(caseId, config.caseStatus.disputeu.key);

            });
            break;

            break;
    }


};


var commentCase = function(req, res, next){
    var caseId = req.params['caseId'];
    var userInfo = req.currentUser;
    var userRole = req.userRole;
    var comment = req.body.comment;

    caseModel.commentCase(caseId, comment, userInfo, userRole, function(err){
        if(err) return next(err);
        res.send({rtn:0});
    });
};



var findLawyerCases = function (req, res, next) {
    var sort = 'updated', page = 0, pageLength = 10, sortDoc = {}, caseType, serviceType;

    if( req.query.caseType && _.pluck(config.userCaseType, 'name').indexOf(req.query.caseType) >= 0){
        caseType = req.query.caseType;
    }

    if( req.query.serviceType && _.pluck(config.userServiceType, 'name').indexOf(req.query.serviceType) >= 0){
        serviceType = req.query.serviceType;
    }

    if (req.query.sort && ['updated', 'geo', 'price1', 'price2'].indexOf(req.query.sort) > 0) {
        sort = req.query.sort;
    }

    if(req.query.sort == 'geo' ){
        if(!req.query.lon || !req.query.lat) {
            return next({rtn:config.errorCode.paramError, message:'无法获取您的位置'});
        }
        if(isNaN(Number(req.query.lon)) || isNaN(Number(req.query.lat))){
            return next({rtn:config.errorCode.paramError, message:'您的位置数据有误'});
        }
    }

    if (req.query.page && !isNaN(Number(req.query.page))) {
        page = Number(req.query.page);
    }

    var query = {status: {$in: [config.caseStatus.online.key, config.caseStatus.bid.key]}};

    if(caseType) query['caseType'] = caseType;
    if(serviceType) query['serviceType'] = serviceType;

    switch (sort) {
        case 'updated':
            sortDoc = {updatedAt: -1, price1: -1};
            break;
        case 'geo':
            query['location'] = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [Number(req.query.lon), Number(req.query.lat)]
                    },
                    $maxDistance: 1000 * 1000,
                    $minDistance: 0
                }
            };
            sortDoc = {};//$near automatically sort by distance
            break;
        case 'price1':
            sortDoc = {price1: -1, updatedAt: -1};
            break;
        case 'price2':
            sortDoc = {price2: -1, updatedAt: -1};
            break;
    }

    caseModel.getCase(query, {sort: sortDoc, limit: pageLength, skip: page * pageLength}, function (err, docs) {
        if(err) return next(err);
        res.send({rtn: 0, data: docs});
    });


};


var getLawyerBidCases = function(req, res, next){
    var openId = req.wxOpenId;

    caseModel.getLawyerBidCases(openId, function(err, list){
        if(err) return next(err);
        res.send({rtn:0, data:list});
    });
};


var createBid = function (req, res, next) {
    var caseId = req.params.caseId;
    var bidDoc = _.pick(req.body, ['price1', 'price2', 'comment']);

    bidDoc.lawyerOpenId = req.wxOpenId;
    bidDoc.lawyerInfo = req.currentUser;

    caseModel.bidCase(caseId, bidDoc, function (err, id) {
        if(err) return next(err);
        res.send({rtn: 0, data: {id: id}});
        notification.noticeStatus2User(caseId, config.caseStatus.bid.key);
    });

};

var updateBid = function(req, res, next){
    var bidId = req.params.bidId;
    var openId = req.wxOpenId;
    var bidDoc = _.pick(req.body, ['price1', 'price2', 'comment']);

    caseModel.updateBid(bidId, bidDoc, openId, function(err){
        if(err) return next(err);
        res.send({rtn:0});
    });
};

var deleteBid = function(req, res, next){
    var bidId = req.params.bidId;
    var openId = req.wxOpenId;

    caseModel.deleteBid(bidId, openId, function(err){
        if(err) return next(err);
        res.send({rtn:0});
        notification.noticeStatus2User(caseId, config.caseStatus.bid.key);
    });
};


var getOneCaseForLawyer = function(req, res, next){
    var caseId = req.params.caseId;

    caseModel.getOneCase(caseId, function(err, value){
        if(err) return next(err);
        res.send({rtn:0, data:value});
    });
};


var updateCaseByLawyer = function(req, res, next){

    var openId = req.wxOpenId;
    var caseId = req.params.caseId;
    var status = req.body.status;

    if([config.caseStatus.process.key, config.caseStatus.closel.key, config.caseStatus.disputel.key].indexOf(status)){
        return callback({rtn:config.errorCode.paramError, message:'invalid status'});
    }

    caseModel.updateCaseStatusByLawyer(caseId, openId, status, function(err){
        if(err) return next(err);
        res.send({rtn:0});

        notification.noticeStatus2User(caseId, status);
    });

};


/*
* get cases order by rank & recommending cases to lawyer
* */

var suggestLawyerCases = function(req, res, next){
    var service = req.currentUser.lawServiceArea;
    if(!service) return next({rtn: config.errorCode.paramError, message: '律师服务领域参数错误'});
    var types = service.split(',');

    if(types.length <= 0) return next({rtn: config.errorCode.paramError, message: '律师服务领域参数错误'});

    caseModel.getCase({caseType: {$in: types}}, {sort: {rank: -1, createdAt: -1}}, function(err, result){
        if(err) return next({rtn: config.errorCode.serviceError, message: err});
        return res.send({rtn: 0, message: '', data: result});
    });
};


/**
        Weixin Config API Below
 */


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

/************* For Weixin page User API ********************/

router.post('/user/bindmobile', bindUserMobile);

router.post('/user/cases', auth.prepareLocalUser(config.optionsUser), createCase);

router.get('/user/cases', getUserCases);

router.post('/user/cases/:caseId', updateCaseByUser);

router.delete('/user/cases/:caseId', cancelCaseByUser);

router.post('/user/cases/:caseId/status', updateCaseStatus);

router.post('/user/cases/:caseId/comments', commentCase);


/************* For Weixin page Lawyer API ********************/

router.get('/ly/cases', findLawyerCases);

router.get('/ly/cases/suggest',auth.prepareLocalUser(config.optionsLawyer), suggestLawyerCases);

router.post('/ly/:caseId/bids', auth.prepareLocalUser(config.optionsLawyer), createBid);

router.delete('/ly/bids/:bidId', deleteBid);

router.post('/ly/:caseId/:bidId', updateBid);

router.get('/ly/cases/:caseId', getOneCaseForLawyer);

router.post('/ly/cases/:caseId/status', updateCaseByLawyer);

router.get('/ly/bids', getLawyerBidCases);

router.post('/ly/cases/:caseId/comments', commentCase);


/************* For Weixin page JSSDK Config  ********************/
router.get('/user/jsconfig', getJSSDKConfig(config.optionsUser));
router.get('/ly/jsconfig', getJSSDKConfig(config.optionsLawyer));


//the error handler
router.use(function (err, req, res, next) {
    console.error('Error: api', req.path, 'error:', err, 'message:', err.message, 'stack:', err.stack);
    res.send({rtn: err.rtn || config.errorCode.unknownError, message: err.message || err.toString()});
});

module.exports = router;
