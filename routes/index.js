/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();
var User = require('../odm/user');


var root = (req, res, next) => {return res.render('index');};
router.get('/', root);


var signin = (req, res, next) => {return res.render('signin');};
router.get('/signin', signin);

module.exports = router;
