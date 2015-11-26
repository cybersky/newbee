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

        if(req.query.code){

            var result;

            return async.waterfall([
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
                    console.log('response', body);

                    var accessToken = body['access_token'];
                    var openId = body['openid'];
                    var unionId = body['unionid'];
                    var refreshToken = body['refresh_token'];
                    var scope = body['scope'];
                    var expiresIn = body['expires_in'];

                    result = body;

                    var url = utils.createURL(config.wxUserInfoURL, {
                        accessToken:accessToken,
                        openId:openId
                    });

                    console.log('request', url);
                    request(url, cb);
                }, function(resp, body, cb){
                    console.log('response', body);
                    cb();
                }

            ], next);

        }

        var url = utils.createURL(config.wxOauthURL, {
            appId:option.appid,
            scope:config.wxScopeInfo,
            state:'init',
            redirectUrl:encodeURI(config.wxPageHost + req.originalUrl)
        });

        console.log('redirect to', url);
        return res.redirect(url);
    };

};


exports.authUser = function(req, res, next){
    var id = req.signedCookies.userId;
    if(!id) return res.redirect('/up/us');//to phase 1 page, mobile number

    var user = mongo.user();
    user.findOne({_id:new ObjectID(id)}, function(err, user){
        if(err) return res.status(404).send('Invalid UserId '+id);
        req.user = _.pick(user, ['mobile', 'openId', 'email', 'username']);
        req.user.id = user._id.toString();
        next();
    })
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