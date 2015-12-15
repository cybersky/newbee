var redis = require('../clients/redis');
var async = require('async');
var request = require('request');
var config = require('../profile/config');
var m = require('moment');
var secure	= require('../tools/secret');


exports.createURL = function(urlPattern, options){
    if(!options ) return urlPattern;

    for(var key in options){
        var keyPattern = ['{{',key,'}}'].join('');
        urlPattern = urlPattern.replace(keyPattern, options[key]);
    }

    return urlPattern;
};



exports.getWXAccessToken = function(option, callback){
    var appId = option.appid;
    var appSecret = option.appsecret;
    if(!appId || !appSecret) return callback(new Error('appid and appsecret not found'));

    var rk = ['wxapi', 'accessToken', appId].join(':');

    async.waterfall([
        function(cb){
            redis.client.get(rk, cb);
        },
        function(token, cb){
            if(token) return callback(null, token);

            var url = exports.createURL(config.wxAccessTokenURL, {APPID:appId, APPSECRET:appSecret});
            request(url, cb);
        },
        function(resp, body, cb){
            if(typeof body == 'string'){
                try{
                    body = JSON.parse(body);
                }catch(err){
                    return cb(new Error('invalid response: '+ body));
                }
            }
            if(body.errcode) return cb(new Error(body.errmsg));

            var at = body.access_token;
            var ex = Number(body.expires_in) - 60;

            cb(null, at);
            redis.client.setex(rk, ex, at);
        }

    ], callback);

};


exports.handleMobileVoice = function(mobile, callback){

    if(!mobile) return callback('Mobile can not be empty');
    if(!/^\d{11}$/.test(mobile)) return callback('invalid mobile number');

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
        url:testHost + path,
        json:{appId:appId, verifyCode:verifyCode, playTimes:'2', to:mobile, displayNum:'777'},
        headers:{
            Authorization:auth
        }
    };
    request.post(option, function(err, resp, body){
        if(err) return callback(err);

        if(body && body.statusCode == '000000' ){
            //console.log('yunxtong ok, sent', option.json);
            var k = [config.redisPrefix.verifyCode, mobile].join(':');
            redis.client.setex(k, 600, verifyCode, callback);
        } else {
            return callback('invalid response:'+body);
        }
    });
};