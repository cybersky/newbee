var express = require('express');
var router = express.Router();
var weixinService = require('weixin-service');
var utils = require('../tools/utils');
var config = require('../profile/config');
var redis = require('../clients/redis.js');
var mongodb = require('../clients/mongo.js');


var handleMessage = function (req, res, type) {

    var obj = req.body;
    //console.log('message type', obj.MsgType);

    switch (obj.MsgType) {

        case 'text':
            return res.text('user:' + obj.Content);
        case 'image':
            //PicUrl
            //MediaId
            console.log('MediaId', obj.MediaId, 'Format', obj.Format);
            break;
        case 'voice':
            //MediaId
            //Format
            //Recognition
            break;
        case 'video':
            //MediaId
            //ThumbMediaId
            break;
        case 'shortvideo':
            //MediaId
            //ThumbMediaId
            break;
        case 'location':
            //Location_X
            //Location_Y
            //Scale
            //Label
            break;
        case 'link':
            //Title
            //Description
            //Url
            break;

        case 'event':
            return handleEvent(obj, type, res);
    }

    res.send('');
};


var activateQRSceneCode4Lawyer = function (sceneId, obj, res) {

    redis.client.get(config.redisKey.QRSceneId + sceneId, function (err, lawyerId) {
        if (err) return callback(err);

        if (!lawyerId) return callback('activateQRSceneCode4Lawyer lawyerId not found error');

        mongodb.lawyer().findOneAndUpdate({_id: ObjectID(lawyerId), status:config.lawyerStatus.raw.key}, {
            $set: {
                status: config.lawyerStatus.subscribe.key,
                openId: obj.FromUserName,
                subscribeAt: new Date()
            }
        }, function (err, result) {
            if(err) return callback(err);
            var lawyer = result.value;
            if( result.ok == 1 ){
                if(err) return console.error(err);
                res.text('欢迎你来到律政新蜂平台，'+lawyer.username+'律师！接下来您需要等待审核通过，然后就可以在平台竞标案件，好好努力！' );
            }
        });
    });
};


var handleSubscribeEvent = function(eventKey, type, obj, res){

    switch (type){
        case 'lawyer':
            //eventKey = qrscene_123123 qrscene_3
            if ( eventKey && eventKey.indexOf('qrscene_') == 0) {
                var qrSceneId = Number(eventKey.substr('qrscene_'.length));
                if( isNaN(qrSceneId) ) return console.error('invalid sceneId', eventKey);
                activateQRSceneCode4Lawyer(qrSceneId, obj, res);
            }
            break;
        case 'user':
            res.text('欢迎来到律蜂平台，这里拥有中国最好的律师，最具有市场竞争力的律政服务，有事儿摆不平，找律蜂！');
            break;
        case 'test':
            res.text('欢迎来到iHailong的测试平台');
            break;
    }

};


var handleLocationEvent = function(obj, type){
    var lat = obj.Latitude;
    var lon = obj.Longitude;
    var p = obj.Precision;

    var rk = ['location', type, openId].join(":");
    var val = JSON.stringify({lat: lat, lon: lon, p: p});
    //console.log('update', openId, 'location', lat, lon, p);
    redis.client.set(rk, val, function (err, result) {
        console.log('update', obj.FromUserName, 'location', lat, lon, p, err, result);
    });
};

var handleEvent = function (obj, type, res) {
    var event = obj.Event;
    var eventKey = obj.EventKey;

    console.log('event', event, 'key', eventKey);

    switch (event) {
        case 'subscribe':
            return handleSubscribeEvent(eventKey, type, obj, res);
        case 'unsubscribe':
            break;
        case 'SCAN':
            break;
        case 'LOCATION':
            handleLocationEvent(obj, type);
            break;
        case 'CLICK':
            break;
        case 'VIEW':
            break;
    }

    res.text('');
};


var handleUserNotice = function (req, res, next) {
    handleMessage(req, res, 'user');
};

var handleLawyerNotice = function (req, res, next) {
    handleMessage(req, res, 'lawyer');
};

var handleTestNotice = function (req, res, next) {
    handleMessage(req, res, 'test');
};

[
    {
        option: config.optionsLawyer,
        handler: handleLawyerNotice
    },
    {
        option: config.optionsUser,
        handler: handleUserNotice
    },
    {
        option: config.optionsTest,
        handler: handleTestNotice
    }
].forEach(function (options) {
        var option = options.option;
        var handler = options.handler;
        var wxs = new weixinService(option);

        router.post('/' + option.appid + '/notice', wxs.bodyParserMiddlewares(), wxs.eventHandle(handler));
        router.get('/' + option.appid + '/notice', wxs.enable());
    });


module.exports = router;