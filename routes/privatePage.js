
var auth = require('../middleware/auth');
var express = require('express');
var router = express.Router();

router.all(auth.authCookie);

module.exports = router;