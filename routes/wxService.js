var express = require('express');
var router = express.Router();
var weixinService = require('weixin-service');
var utils = require('../tools/utils');
var config = require('../profile/config');
var redis = require('../clients/redis.js');



var handleMessage = function(req, res, type){

    var obj = req.body;
    //console.log('message type', obj.MsgType);

    switch(obj.MsgType){

        case 'text':
            return res.text('user:' + obj.Content);
            break;
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
            handleEvent(obj, type);
            break;
    }

    res.send('');
};


var handleEvent = function(obj, type){
    var event = obj.Event;
    var eventKey = obj.EventKey;
    var openId = obj.FromUserName;

    console.log('event', event, 'key', eventKey);

    switch (event){
        case 'subscribe':
            break;
        case 'unsubscribe':
            break;
        case 'SCAN':
            break;
        case 'LOCATION':
            var lat = obj.Latitude;
            var lon = obj.Longitude;
            var p = obj.Precision;

            var rk = ['location', type, 'openId'].join(":");
            //console.log('update', openId, 'location', lat, lon, p);
            redis.client.set(rk, {lat:lat, lon:lon, p:p}, function(err, result){
                console.log('update', openId, 'location', lat, lon, p, err, result);
            });
            break;
        case 'CLICK':
            break;
        case 'VIEW':
            break;
    }
};


var handleUserNotice = function(req, res, next){
    handleMessage(req, res, 'user');
};

var handleLawyerNotice = function(req, res, next){
    handleMessage(req, res, 'lawyer');
};

var handleTestNotice = function(req, res, next){
    handleMessage(req, res, 'test');
};

[
    {
        option:config.optionsLawyer,
        handler:handleLawyerNotice
    },
    {
        option:config.optionsUser,
        handler:handleUserNotice
    },
    {
        option:config.optionsTest,
        handler:handleTestNotice
    }
].forEach(function(options){
    var option = options.option;
    var handler = options.handler;
    var wxs = new weixinService(option);

    router.post('/'+option.appid+'/notice', wxs.bodyParserMiddlewares(), wxs.eventHandle(handler));
    router.get('/'+option.appid+'/notice', wxs.enable());
});


module.exports = router;