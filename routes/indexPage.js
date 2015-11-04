/**
 * Created by Daniels on 2015/10/17.
 */
var express = require('express');
var router = express.Router();
var auth    = require('../middleware/auth');

var signup = (req, res, next) => {
    return res.render('signup', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};
router.get('/signup', signup);


var signin = (req, res, next) => {return res.render('signin',
    {
        options: {target: 'signin', action:'none'},
        userInfo: req.session.userInfo
    }
)};
router.get('/signin', signin);

module.exports = router;
