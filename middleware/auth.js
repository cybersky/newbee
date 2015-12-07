/**
 * Created by Daniels on 10/22/15.
 */
var config = require('../profile/config');
var secure = require('../tools/secret');
var mongo = require('../clients/mongo');
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');
var request = require('request');
var async = require('async');
var utils = require('../tools/utils');


exports.oauthWXOpenId = function(option){

    return function(req, res, next){
        var openId = req.signedCookies.openId;
        if(openId) return next();

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
                req.roleCollection = option.roleCollection;

                res.cookie('openId', openId, {maxAge:365*24*3600*1000, secure:true});

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

        if(!req.roleCollection || !req.wxOpenId) return next('invalid roleCollection or wxOpenId');

        var queryDoc = {openId:req.wxOpenId};
        var updateDoc = {lastAccess:new Date()};
        if(req.wxUserInfo && req.wxUserInfo.openid == req.wxOpenId ){
            updateDoc.openInfo = req.wxUserInfo;
        }

        var col = mongo.collection(req.roleCollection);

        col.findAndModify(queryDoc, [], {$set:updateDoc, $setOnInsert:{createdAt:new Date()} }, {new:true,upsert:true }, function(err, result){
            if(err) return next(err);
            req.currentUser = result;
            console.log('mongo found', req.currentUser);
            if(config.requireMobileSignIn && !req.current.mobile){
                console.log('no mobile number found, redirect to compete user info page');
                return res.redirect('/wp/user/signup');
            }
            next();
        });

    };
};


exports.authCookie = (req, res, next) => {
    var cookie = req.cookies[config.cookieConfig.name];
    if(!cookie) {
		req.session.destroy();
		return res.redirect(302, '/up/signin');
	}

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
    if(!cookie) {
		req.session.destroy();
		return res.redirect(302, '/ap/signin');
	}

	var str = cookie.split(':');
	if(secure.md5(str[1]+config.operatorCookie.privateKey) != str[str.length - 1]) {
		res.clearCookie(config.operatorCookie.name);
		req.session.destroy();
		return res.redirect(302, '/ap/signin');
	}

    return next();
};

exports.authAdminSignIn = (req, res, next) => {
	var cookie = req.cookies[config.operatorCookie.name];
	if(cookie) return res.redirect('/ap/manager');

	return next();

};