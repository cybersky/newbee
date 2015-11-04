/**
 * Created by Daniels on 10/28/15.
 */
var express = require('express');
var router = express.Router();
var auth    = require('../middleware/auth');
var config  = require('../profile/config');

var index = (req, res, next) => {
    return res.send('I am index');
};
router.get('/', auth.authOperatorCookie, index);

var login = (req, res, next) => {
    return res.render('admin/signin', {options:{}, adminInfo: req.session.adminInfo});
};
router.get('/login', login);

var manager = (req, res, next) => {
    return res.render('admin/manager', {
        options: {target: 'manager'},
        adminInfo: req.session.adminInfo
    });
};
router.get('/manager', manager);

module.exports = router;
