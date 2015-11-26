var express = require('express');
var router = express.Router();
var weixinService = require('weixin-service');
var utils = require('../tools/utils');
var config = require('../profile/config');

var handleUserNotice = function(req, res, next){
    console.log('body', req.body);
    res.text('user:' + req.body['Content']);
};

var handleLawyerNotice = function(req, res, next){
    console.log('body', req.body);
    res.text('lawyer:' + req.body['Content']);
};

var handleTestNotice = function(req, res, next){
    console.log('body test:', req.body);
    res.text('test account:' + req.body['Content']);
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