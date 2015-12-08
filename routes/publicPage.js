/**
 * Created by hailongzhao on 11/21/15.
 */

var express = require('express');
var router = express.Router();
var config  = require('../profile/config');
var auth    = require('../middleware/auth');
var secret = require('../tools/secret');
var mongo = require('../clients/mongo');
var Lawyer = require('../model/lawyer');

var root = (req, res, next) => {
    return res.render('index', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};

var LawyerSignup = (req, res, next) => {
    return res.render('lawyer/signup', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};

var LawyerSignin = (req, res, next) => {
    return res.render('lawyer/signin', {
            options: {target: 'signin', action:'none'},
            userInfo: req.session.userInfo
        }
    )
};

var lawyerSignOut = (req, res, next) => {
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    req.session.destroy();
    return res.redirect('/');
};


router.get('/signup', LawyerSignup);
router.get('/signin', auth.authLawyerSignIn, LawyerSignin);
router.get('/logout', lawyerSignOut);
router.get('/', auth.authCookie, root);



module.exports = router;