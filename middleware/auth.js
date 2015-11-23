/**
 * Created by Daniels on 10/22/15.
 */
var config = require('../profile/config');
var secure = require('../tools/secret');
var mongo = require('../clients/mongo');
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');

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