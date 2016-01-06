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
    if(req.signedCookies[config.cookieConfig.name])
        return res.redirect('/up/subscribe');

    return res.render('lawyer/signin', {options: {}});
};

var lawyerSignOut = function(req, res, next){
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    return res.redirect('/');
};

var subscribe = function(req, res, next){
    Lawyer.getOneLawyer(req.signedCookies[config.cookieConfig.name], function(err, doc){
        return res.render('lawyer/subscribe', {lawyerInfo: doc});
    });
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
    var cookie = req.signedCookies[config.cookieConfig.name];
    if(cookie){
        Lawyer.getOneLawyer(cookie, function(err, doc){
            if(doc.status == 'raw') return res.redirect('/up/subscribe');
            return res.render('index', {lawyerInfo: doc});
        });
    }else{
        return res.render('index');
    }
});

module.exports = router;