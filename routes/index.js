/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();
var User = require('../odm/user');
var middleware = require('../middleware/auth');

var root = (req, res, next) => {
    return res.render('index', {
        userInfo: req.session.userInfo
    });
};
router.get('/', root);
module.exports = router;
