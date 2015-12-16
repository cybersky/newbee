/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();
var auth = require('../middleware/auth');

var root = (req, res, next) => {
    return res.render('index');
};
router.get('/', auth.authCookie, root);
module.exports = router;
