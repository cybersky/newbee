/**
 * Created by Daniels on 10/28/15.
 */
var express = require('express');
var router = express.Router();
var auth    = require('../middleware/auth');
var config  = require('../profile/config');


var root = (req, res, next) => {
	return res.redirect('/ap/manager');
};


var login = (req, res, next) => {
    return res.render('admin/signin', {options:{}, adminInfo: req.session.adminInfo});
};

var manager = (req, res, next) => {
    return res.render('admin/manager', {
        options: {target: 'manager'},
        adminInfo: req.session.adminInfo
    });
};


var signOut = (req, res, next) => {
    res.clearCookie(config.operatorCookie.name, {path: config.operatorCookie.options.path});
    req.session.destroy();
    return res.redirect('/ap/signin');
};


router.get('/', root);
router.get('/signout', signOut);
router.get('/signin', auth.authAdminSignIn, login);
router.get('/manager', auth.authOperatorCookie,  manager);


module.exports = router;
