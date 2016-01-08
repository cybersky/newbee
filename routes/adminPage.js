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
    return res.render('admin/lawyerDetail', {
        options:{id: lawyerId, target: 'manager', action: 'findOne'},
        adminInfo: req.adminInfo
    });
};

var operator = function(req, res, next){
    return res.render('admin/operator', {
        options:{ target: 'operator' },
        adminInfo: req.adminInfo, levels: config.operatorLevel
    });
};

var operatorDetail = function(req, res, next){
    var operatorId = req.params['operatorId'];
    if(!operatorId) return res.send('Page Not Fount').status(404);

    return res.render('admin/operatorDetail', {
        options:{ target: 'operator', id: operatorId , action: 'findOne'},
        adminInfo: req.adminInfo, levels: config.operatorLevel
    });
};

var _case = function(req, res, next){
    return res.render('admin/case', {
        options:{ target: 'case'}, adminInfo: req.adminInfo,
        rank: config.userCaseRank
    });
};

router.get('/signin', function(req, res, next){
    var cookie = req.cookies[config.operatorCookie.name];
    if(cookie) return res.redirect('/ap/manager');
    return next();
}, signin);


router.get('/signout', signOut);
router.get('/manager', auth.authOperatorCookie, auth.prepareAdminInfo, manager);
router.get('/manager/detail/:lawyerId', auth.authOperatorCookie,  auth.prepareAdminInfo, lawyerDetail);
router.get('/operator', auth.authOperatorCookie, auth.prepareAdminInfo, operator);
router.get('/operator/detail/:operatorId', auth.authOperatorCookie,  auth.prepareAdminInfo, operatorDetail);
router.get('/case', auth.authOperatorCookie, auth.prepareAdminInfo, _case);

module.exports = router;
