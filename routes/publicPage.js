/**
 * Created by Daniels on 10/19/15.
 */

/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();

var signup = (req, res, next) => {return res.render('signup');};
router.get('/signup', signup);


var signin = (req, res, next) => {return res.render('signin');};
router.get('/signin', signin);

module.exports = router;
