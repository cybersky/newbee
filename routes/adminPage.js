/**
 * Created by Daniels on 10/28/15.
 */
var express = require('express');
var router = express.Router();
var auth    = require('../middleware/auth');
var config  = require('../profile/config');

var signin = function(req, res, next){
    return res.render('admin/signin');
};

var signOut = function(req, res, next){
    res.clearCookie(config.operatorCookie.name, {path: config.operatorCookie.options.path});
    return res.redirect('/ap/signin');
};

var manager = function(req, res, next){
    return res.render('admin/manager', {
        options: {target: 'manager'},
        adminInfo: req.adminInfo
    });
};

var lawyerDetail = function(req, res, next){
    var lawyerId = req.params['lawyerId'];
    return res.render('admin/detail', {
        options:{
            id: lawyerId, target: 'manager', action: 'findOne'
        },
        adminInfo: req.adminInfo
    });
};

router.get('/signin', function(req, res, next){
    var cookie = req.cookies[config.operatorCookie.name];
    if(cookie) return res.redirect('/ap/manager');
    return next();
}, signin);


router.get('/signout', signOut);
router.get('/manager', auth.authOperatorCookie, auth.prepareAdminInfo, manager);
router.get('/detail/:lawyerId', auth.authOperatorCookie,  auth.prepareAdminInfo, lawyerDetail);


module.exports = router;
