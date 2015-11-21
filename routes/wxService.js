/**
 * Created by hailongzhao on 10/25/15.
 */
var options = {
    appid:               "wx9255a6db434d4445",
    appsecret:           "your app_secret",
    token:               "tobeabetterman123",
    encrypt_key:         "CNqS9x3rlZIB8DXasI4tPceB0MgiqoZ1QzRXkC2pRdy"
};

var weixinService = require('weixin-service');
var wxs = new weixinService(options);
var express = require('express');
var router = express.Router();


var eventHandle = function(req, res, next){
    console.log('body', req.body);
    res.text('echo', req.body.Content);
};


router.post('/notice', wxs.bodyParserMiddlewares(), wxs.eventHandle(eventHandle));
router.get('/notice', wxs.enable());


module.exports = router;