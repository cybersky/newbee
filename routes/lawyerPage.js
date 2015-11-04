/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();
var auth    = require('../middleware/auth');

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
router.get('/', auth.authCookie, root);
router.get('/signup', signup);
router.get('/signin', auth.authLawyerSignIn, signin);

module.exports = router;
