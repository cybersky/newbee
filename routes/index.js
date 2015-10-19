/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();
var User = require('../odm/user');


/* GET home page. */
router.get('/', function(req, res, next) {
	res.send('Hello world!');
});

module.exports = router;
