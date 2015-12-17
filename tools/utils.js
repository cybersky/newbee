var redis = require('../clients/redis');
var async = require('async');
var request = require('request');
var config = require('../profile/config');
var m = require('moment');
var secure = require('../tools/secret');


exports.createURL = function (urlPattern, options) {
    if (!options) return urlPattern;

    for (var key in options) {
        var keyPattern = ['{{', key, '}}'].join('');
        urlPattern = urlPattern.replace(keyPattern, options[key]);
    }

    return urlPattern;
};


exports.getWXAPITicket = function (option, type, callback) {

    if(typeof arguments[arguments.length-1] != 'function'){
        throw new Error('invalid callback');
    }

    if(['jsapi'].indexOf(type) < 0) return callback(new Error('invalid ticket type:'+type));

    async.waterfall([
        function(cb){
            var appId = option.appid;
            var rk = ['wxticket', type, appId].join(':');
            redis.client.get(rk, cb);
        },
        function (ticket, cb) {
            if(ticket) return callback(null, ticket);
            exports.getWXAccessToken(option, cb);
        },
        function (at, cb) {
            var url = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token='+at+'&type='+type;
            request(url, cb);
        },
        function(resp, body, cb){
            if(typeof body == 'string'){
                try{
                    body = JSON.parse(body);
                }catch(e){
                    return cb(new Error('invalid api response:'+body));
                }
            }
            if(body.errcode) return cb(new Error(body.errmsg));

            var ticket = body.ticket;
            var expires = body.expires_in - 60;

            var appId = option.appid;
            var rk = ['wxticket', type, appId].join(':');

            cb(null, ticket);

            redis.client.setex(rk, expires, ticket);

        }


    ], callback);
};

exports.getJSAPIConfig = function(option, url, callback){

    if(typeof arguments[arguments.length-1] != 'function'){
        throw new Error('invalid callback');
    }

    async.waterfall([
        function(cb){
            exports.getWXAPITicket(option, 'jsapi', cb);
        },
        function(ticket, cb){

            console.log('ticket', ticket);

            var nonce = String.prototype.substr.call(Math.random(), 2, 8);
            var timestamp = (Date.now()/1000).toFixed();

            var sigstring = ['jsapi_ticket=', ticket, '&noncestr=', nonce, '&timestamp=', timestamp, '&url=', url].join('');

            var sighash = secure.sha1(sigstring);

            var config = {
                appId:option.appid,
                timestamp:timestamp,
                nonceStr:nonce,
                signature:sighash,
                url:url
            };

            return cb(null, config);
        }

    ], callback);


};


exports.getQRCode = function (option, sceneId, callback) {

    if(typeof arguments[arguments.length-1] != 'function'){
        throw new Error('invalid callback');
    }

    if(! (sceneId > 0 && sceneId < 10000)) return callback(new Error('sceneId 1-10000'));

    async.waterfall([
        function (cb) {
            exports.getWXAccessToken(option, cb);
        },
        function (at, cb) {
            var url = 'https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=' + at;

            var body = {
                "expire_seconds": 604800,
                "action_name": "QR_SCENE",
                "action_info": {"scene": {"scene_id": sceneId}}
            };

            var op = {url: url, json: body};
            request.post(op, cb);
        },
        function (resp, body, cb) {
            if(typeof body == 'string'){
                try{
                    body = JSON.parse(body);
                }catch(e){
                    return cb(new Error('invalid QR response:'+body));
                }
            }
            if(body.errcode) return cb(new Error(body.errmsg));

            var ticket = body.ticket;
            var url = body.url;
            var es = body.expire_seconds;

            var url = 'https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket='+ticket;

            cb(null, url);
        }


    ], callback);
};

exports.getWXAccessToken = function (option, callback) {
    var appId = option.appid;
    var appSecret = option.appsecret;
    if (!appId || !appSecret) return callback(new Error('appid and appsecret not found'));

    var rk = ['wxapi', 'accessToken', appId].join(':');

    async.waterfall([
        function (cb) {
            redis.client.get(rk, cb);
        },
        function (token, cb) {
            if (token) return callback(null, token);

            var url = exports.createURL(config.wxAccessTokenURL, {APPID: appId, APPSECRET: appSecret});
            request(url, cb);
        },
        function (resp, body, cb) {
            if (typeof body == 'string') {
                try {
                    body = JSON.parse(body);
                } catch (err) {
                    return cb(new Error('invalid response: ' + body));
                }
            }
            if (body.errcode) return cb(new Error(body.errmsg));

            var at = body.access_token;
            var ex = Number(body.expires_in) - 60;

            cb(null, at);
            redis.client.setex(rk, ex, at);
        }

    ], callback);

};

exports.getLocation = function (openId, type, cb) {
    var rk = ['location', type, openId].join(":");

    /* {lat:lat, lon:lon, p:p} */
    redis.client.get(rk, function (err, result) {
            if (err) return cb(err);
            if (!result) return cb(null, null);
            try {
                cb(null, JSON.parse(result));
            } catch (ex) {
                return cb(new Error('error parse loc:' + result));
            }
        }
    );
};


exports.handleMobileVoice = function (mobile, callback) {

    if (!mobile) return callback('Mobile can not be empty');
    if (!/^\d{11}$/.test(mobile)) return callback('invalid mobile number');

    //APP ID
    var appId = config.ytxConfig.appId;
    //APP TOKEN
    var appToken = config.ytxConfig.appToken;
    //ACCOUNT SID：
    var accountId = config.ytxConfig.accountId;
    //AUTH TOKEN：
    var authToken = config.ytxConfig.authToken;

    var testHost = config.ytxConfig.testHost;
    var prodHost = config.ytxConfig.prodHost;
    var path = config.ytxConfig.path;

    var ts = m().format('YYYYMMDDHHmmss');
    var sig = secure.md5([accountId, authToken, ts].join(''), 'utf8', 'hex').toUpperCase();

    path = path.replace('{accountId}', accountId);
    path = path.replace('{sig}', sig);

    var auth = new Buffer([accountId, ts].join(':'), 'utf8').toString('base64');

    var verifyCode = String.prototype.substr.call(Math.random(), 2, 4);

    var option = {
        url: testHost + path,
        json: {appId: appId, verifyCode: verifyCode, playTimes: '2', to: mobile, displayNum: '777'},
        headers: {
            Authorization: auth
        }
    };
    request.post(option, function (err, resp, body) {
        if (err) return callback(err);

        if (body && body.statusCode == '000000') {
            //console.log('yunxtong ok, sent', option.json);
            var k = [config.redisPrefix.verifyCode, mobile].join(':');
            redis.client.setex(k, 600, verifyCode, callback);
        } else {
            return callback('invalid response:' + body);
        }
    });
};