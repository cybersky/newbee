/**
 * Created by Daniels on 10/19/15.
 */
var express = require('express');
var router = express.Router();
var config  = require('../config');

var logout = (req, res, next) => {
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    req.session.destroy();
    return res.redirect('/');
};
router.get('/user/signout', logout);


module.exports = router;