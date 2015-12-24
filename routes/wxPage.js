var express = require('express');
var router = express.Router();
var weixinService = require('weixin-service');
var utils = require('../tools/utils');
var config = require('../profile/config');
var auth = require('../middleware/auth');

router.use('/user/*', auth.oauthWXUser(config.optionsUser));

router.use('/ly/*', auth.oauthWXUser(config.optionsLawyer));

router.use('/test/*', auth.oauthWXUser(config.optionsTest));


router.get('/user/home', function (req, res, next) {
    res.render('weixin/user/home', {
        info: req.currentUser,
        caseType: config.userCaseType,
        serviceType: config.userServiceType
    });
});

router.get('/ly/home', function (req, res, next) {
    res.render('weixin/user/home', {
        info: req.currentUser,
        caseType: config.userCaseType,
        serviceType: config.userServiceType
    });
});

router.get('/test/home', function (req, res, next) {
    res.send('hello from home test');
});

router.get('/user/signup', function (req, res, next) {
    res.render('weixin/user/signup', {info: req.currentUser});
});

router.post('/user/cases', function (req, res, next) {
    console.log(res.body);

    res.render();
});

module.exports = router;