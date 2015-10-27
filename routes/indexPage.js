/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();
var auth    = require('../middleware/auth');

var signup = (req, res, next) => {
    return res.render('signup', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};
router.get('/signup', signup);


var signin = (req, res, next) => {return res.render('signin',
    {
        options: {target: 'signin', action:'none'},
        userInfo: req.session.userInfo
    }
)};
router.get('/signin', signin);

var manager = (req, res, next) => {
    return res.render('manager', {
        options: {target: 'manager'},
        userInfo: req.session.userInfo
    });
};
router.get('/manager', auth.authSuperUser, manager);

module.exports = router;
