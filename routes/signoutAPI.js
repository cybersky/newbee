/**
 * Created by Daniels on 10/19/15.
 */
var express = require('express');
var router = express.Router();
var config  = require('../profile/config');

var lawyerSignOut = (req, res, next) => {
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    req.session.destroy();
    return res.redirect('/');
};

var adminSignOut = (req, res, next) => {
	res.clearCookie(config.operatorCookie.name, {path: config.operatorCookie.options.path});
	req.session.destroy();
	return res.redirect('/ap/signin');
};
router.get('/user/signout', lawyerSignOut);
router.get('/admin/signout', adminSignOut);


module.exports = router;