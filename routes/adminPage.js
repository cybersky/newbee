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
    return res.send('I am login page');
};
router.get('/login', login);

module.exports = router;
