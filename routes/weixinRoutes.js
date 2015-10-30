/**
 * Created by hailongzhao on 10/25/15.
 */


var options = {
    appid:               "your app_id",
    appsecret:           "your app_secret",
    token:               "token",
    encrypt_key:         "encrypt_keyasdfdasfsafasdfasdfadsfas"
};
var wxs = require('weixin-service')(options);

var router = new Route();

router.get('/api/notice', wxs.enable());
router.post('/api/notice', wxs.noticeHandle(noticeHandle));

router.get('/api/:appid/event', wxs.enable());
router.post('/wechat/:appid/event', wxs.eventHandle(eventHandle));

var noticeHandle = function(){

};

var eventHandle = function(){

};

module.exports = router;