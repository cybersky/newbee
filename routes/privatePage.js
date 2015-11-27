
var auth = require('../middleware/auth');
var express = require('express');
var router = express.Router();
var secret = require('../tools/secret');
var mongo = require('../clients/mongo');
var ObjectID = require('mongodb').ObjectID;



module.exports = router;