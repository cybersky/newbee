/**
 * Created by hailongzhao on 11/21/15.
 */

var express = require('express');
var router = express.Router();
var config  = require('../profile/config');
var auth    = require('../middleware/auth');

var lawyerSignup = (req, res, next) => {
    return res.render('lawyer/signup', {
        options: {target: 'signup', action:'none'}
    });
};

var lawyerSignin = (req, res, next) => {
    return res.render('lawyer/signin', {
        options: {target: 'signin', action:'none'}
    });
};

var lawyerSignOut = (req, res, next) => {
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    return res.redirect('/');
};

//lawyers register
router.get('/signup', lawyerSignup);


router.get('/signin', function(req, res, next){
    var cookie = req.cookies[config.cookieConfig.name];
    if (cookie) return res.redirect('/');
    return next();

}, lawyerSignin);
router.get('/logout', lawyerSignOut);



module.exports = router;