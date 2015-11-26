var express = require('express');
var router = express.Router();
var weixinService = require('weixin-service');
var utils = require('../tools/utils');
var config = require('../profile/config');
var auth = require('../middleware/auth');




router.use('/user/*', auth.oauthWXOpenId(config.optionsUser));

router.use('/ly/*', auth.oauthWXOpenId(config.optionsLawyer));

router.use('/test/*', auth.oauthWXOpenId(config.optionsTest));

router.get('/user/home', function(req, res, next){
    res.send('hello from home user');
});

router.get('/ly/home', function(req, res, next){
    res.send('hello from home lawyer');
});

router.get('/test/home', function(req, res, next){
    res.send('hello from home test');
});


module.exports = router;