/**
 * Created by hailongzhao on 11/21/15.
 */

var express = require('express');
var router = express.Router();
var config  = require('../profile/config');
var auth    = require('../middleware/auth');
var secret = require('../tools/secret');
var mongo = require('../clients/mongo');

var root = (req, res, next) => {
    return res.render('index', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};

var signup = (req, res, next) => {
    return res.render('lawyer/signup', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};

var signin = (req, res, next) => {
    return res.render('lawyer/signin', {
            options: {target: 'signin', action:'none'},
            userInfo: req.session.userInfo
        }
    )};


var adminSignOut = (req, res, next) => {
    res.clearCookie(config.operatorCookie.name, {path: config.operatorCookie.options.path});
    req.session.destroy();
    return res.redirect('/ap/signin');
};



var lawyerSignOut = (req, res, next) => {
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    req.session.destroy();
    return res.redirect('/');
};

router.get('/admin/signout', adminSignOut);
router.get('/', auth.authCookie, root);
router.get('/signup', signup);
router.get('/signin', auth.authLawyerSignIn, signin);
router.get('/user/signout', lawyerSignOut);


var userSignup = function(req, res, next){
    res.render('user/signup');
};

router.get('/us', userSignup);

module.exports = router;