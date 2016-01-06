/**
 * Created by hailongzhao on 11/21/15.
 */

var express = require('express');
var router = express.Router();
var config  = require('../profile/config');
var auth    = require('../middleware/auth');
var Lawyer  = require('../odm/lawyer');

var lawyerSignup = function(req, res, next){
    return res.render('lawyer/signup', {options: {}, services: config.userCaseType});
};

var lawyerSignin = function(req, res, next){
    if(req.cookies[config.lawyerSignUpToken.name])
        return res.redirect('/up/subscribe');

    return res.render('lawyer/signin', {options: {}});
};

var lawyerSignOut = function(req, res, next){
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    return res.redirect('/');
};

var subscribe = function(req, res, next){
    return res.render('lawyer/subscribe');
};

router.get('/subscribe', subscribe);
//lawyers register
router.get('/signup', lawyerSignup);


router.get('/signin', function(req, res, next){
    var cookie = req.cookies[config.cookieConfig.name];
    if (cookie) return res.redirect('/');
    return next();

}, lawyerSignin);
router.get('/signout', lawyerSignOut);


router.get('/', function(req, res, next){
    var cookie = req.cookies[config.cookieConfig.name];
    if(cookie){
        var arr = cookie.split(':');
        var id = arr[2];
        Lawyer.getOneLawyer(id, function(err, doc){
            if(err) {
                return res.render('index', {lawyerInfo: err});
            }
            return res.render('index', {lawyerInfo: doc});
        });
    }else{
        return res.render('index');
    }
});

module.exports = router;