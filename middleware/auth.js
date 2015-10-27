/**
 * Created by Daniels on 10/22/15.
 */


var config = require('../config');
var secure = require('../tools/secret');

exports.checkStatus = (req, res, next) => {
    var cookie = req.cookies[config.cookieConfig.name];

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