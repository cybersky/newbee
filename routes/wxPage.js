var express = require('express');
var router = express.Router();
var weixinService = require('weixin-service');
var utils = require('../tools/utils');
var config = require('../profile/config');
var auth = require('../middleware/auth');


router.use('/user/home', auth.oauthWXOpenId(config.optionsUser), auth.authWXUser());
router.use('/ly/*', auth.oauthWXOpenId(config.optionsLawyer), auth.authWXUser());
router.use('/test/*', auth.oauthWXOpenId(config.optionsTest), auth.authWXUser());


router.get('/user/home', function(req, res, next){
    res.render('weixin/user/showinfo', {info:req.currentUser});
});

router.get('/ly/home', function(req, res, next){
    res.send('hello from home lawyer');
});

router.get('/test/home', function(req, res, next){
    res.send('hello from home test');
});

router.get('/user/signup', function(req, res, next){
    res.render('weixin/user/signup', {info:req.currentUser});
});


module.exports = router;