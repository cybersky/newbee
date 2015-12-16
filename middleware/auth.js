/**
 * Created by Daniels on 10/22/15.
 */
var config = require('../profile/config');
var secure = require('../tools/secret');
var mongo = require('../clients/mongo');
var request = require('request');
var async = require('async');
var utils = require('../tools/utils');
var Operator = require('../odm/operator');


exports.oauthWXOpenId = function(option){

    return function(req, res, next){
        req.roleCollection = option.roleCollection;
        //skip test
        if(req.query.openId == config.backDoorOpenId){
            req.wxOpenId = config.backDoorOpenId;
            req.currentUser = {
                "openId" : config.backDoorOpenId,
                "lastAccess" : new Date("2015-12-08T14:24:01.463Z"),
                "openInfo" : {
                    "openid" : "hellomytest",
                    "nickname" : "hellomytest",
                    "sex" : 1,
                    "language" : "zh_CN",
                    "city" : "海淀",
                    "province" : "北京",
                    "country" : "中国",
                    "headimgurl" : "http://wx.qlogo.cn/mmopen/ccvPic0PMFqLM9ibzZWJLsTwuzTMc1nGbjwpZmOgOaPdfQAIRduhWXndtgwDZRuZusCTTPnToqVibibZmZWfzQoy6hcibgicDJbKVl/0",
                    "privilege" : [ ],
                    "unionid" : "op3Elt65DCYlvfpwiBk8zJJuwSXk"
                },
                "createdAt" : new Date("2015-12-07T09:48:42.770Z")
            };
            res.cookie('openId', config.backDoorOpenId, {maxAge:24*3600*1000, signed:true});
            return next();
        }

        var openId = req.signedCookies.openId;
        if(openId) {
            console.log('found openId', openId);
            req.wxOpenId = openId;
            return next();
        }

        if(!req.query.code){
            var url = utils.createURL(config.wxOauthURL, {
                appId:option.appid,
                scope:config.wxScopeInfo,
                //scope:config.wxScopeBase,
                state:'init',
                redirectUrl:encodeURIComponent(config.wxPageHost + req.originalUrl)
            });

            console.log('redirect to', url);
            return res.redirect(url);
        }

        async.waterfall([
            function(cb){

                var url = utils.createURL(config.wxTokenURL, {
                    appId:option.appid,
                    appSecret:option.appsecret,
                    code:req.query.code
                });

                console.log('request', url);
                request(url, cb);
            }, function(resp, body, cb){
                /*

                 {
                 "access_token":"ACCESS_TOKEN",
                 "expires_in":7200,
                 "refresh_token":"REFRESH_TOKEN",
                 "openid":"OPENID",
                 "scope":"SCOPE",
                 "unionid": "o6_bmasdasdsad6_2sgVt7hMZOPfL"
                 }

                 */
                if(typeof body == 'string'){
                    try{
                        body = JSON.parse(body);
                    }catch(err){
                        return cb('invalid response body: '+ body);
                    }
                }

                console.log('code response', body);

                if(body['errcode']){
                    return cb(new Error(body['errmsg']));
                }

                var accessToken = body['access_token'];
                var openId = body['openid'];
                var unionId = body['unionid'];
                var refreshToken = body['refresh_token'];
                var scope = body['scope'];
                var expiresIn = body['expires_in'];


                req.wxOpenId = openId;
                res.cookie('openId', openId, {maxAge:365*24*3600*1000, signed:true});

                if( scope == config.wxScopeInfo ){
                    var url = utils.createURL(config.wxUserInfoURL, {
                        accessToken:accessToken,
                        openId:openId
                    });

                    console.log('request', url);
                    return request(url, cb);
                }

                cb(null, null, null);

            }, function(resp, body, cb){

                if(body && typeof body == 'string'){
                    try{
                        body = JSON.parse(body);
                    }catch(err){
                        return cb('invalid response body: '+ body);
                    }
                    console.log('info response', body);
                    req.wxUserInfo = body;
                }
                cb();
            }
        ], next);
    }
};

exports.authWXUser = function(options){

    return function(req, res, next){

        if(req.query.openId == config.backDoorOpenId) return next();

        if(!req.roleCollection || !req.wxOpenId) return next('invalid roleCollection or wxOpenId');

        var queryDoc = {openId:req.wxOpenId}, updateDoc = {updatedAt:new Date()};

        if(req.wxUserInfo && req.wxUserInfo.openid == req.wxOpenId ){
            updateDoc.openInfo = req.wxUserInfo;
        }

        var col = mongo.collection(req.roleCollection);

        async.waterfall([
            function(cb){
                col.findOne(queryDoc, cb);
            },
            function(user, cb){
                if(!user || (user.updatedAt - Date.now() > 7*24*3600*1000) ){
                    return col.findAndModify(queryDoc, [], {$set:updateDoc, $setOnInsert:{createdAt:new Date()} }, {new:true,upsert:true }, function(err, result){
                        if(err) return next(err);

                        var value = result.value;
                        var lastErrorObject = result.lastErrorObject; // {updatedExsiting:true, "n":1}
                        var ok = result.ok;

                        cb(null, value);
                    });
                }
                cb(null, user);
            },
            function(user, cb){
                req.currentUser = user;

                if(config.requireMobileSignIn && !req.currentUser.mobile && req.originalUrl.indexOf('/wp/user/signup') < 0  ){
                    console.log('no mobile number found, redirect to compete user info page');
                    return res.redirect('/wp/user/signup');
                }
                cb();
            }

        ], next);

    };
};


exports.authCookie = (req, res, next) => {
    var cookie = req.cookies[config.cookieConfig.name];
    if(!cookie) return res.redirect(302, '/up/signin');

    var str = cookie.split(':');
    if(secure.md5(str[1]+config.cookieConfig.privateKey) != str[str.length - 1]) {
        res.clearCookie(config.cookieConfig.name);
        return res.redirect('/up/signin');
    }
    return next();
};

exports.authLawyerSignIn = (req, res, next) => {
	var cookie = req.cookies[config.cookieConfig.name];
	if(cookie) return res.redirect('/');

	return next();

};


exports.authOperatorCookie = (req, res, next) => {
	var cookie = req.cookies[config.operatorCookie.name];
    if(!cookie) return res.redirect(302, '/ap/signin');

	var str = cookie.split(':');
	if(secure.md5(str[1]+config.operatorCookie.privateKey) != str[str.length - 1]) {
		res.clearCookie(config.operatorCookie.name);
		return res.redirect(302, '/ap/signin');
	}

    next();
};

exports.prepareAdminInfo = function(req, res, next){
    var cookie = req.cookies[config.operatorCookie.name];
    var str = cookie.split(':');
    Operator.getOperatorById(str[2], function(err, doc){
        if(err) req.adminInfo = err || {};
        if(doc._doc.password) delete doc._doc.password;
        req.adminInfo = doc._doc;
        return next();
    });
};