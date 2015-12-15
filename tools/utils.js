var redis = require('../clients/redis');
var async = require('async');
var request = require('request');

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