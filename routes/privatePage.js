
var auth = require('../middleware/auth');
var express = require('express');
var router = express.Router();
var secret = require('../tools/secret');
var mongo = require('../clients/mongo');
var ObjectID = require('mongodb').ObjectID;

router.all('/u/*', auth.authUser);
router.all('/l/*', auth.authLawyerSignIn);

var getHome = function(req, res, next){
    res.render('user/home', {user:req.user});
};

var userSignup2 = function(req, res, next){
    res.render('user/signup2');
};

var handleUserSignup2 = function(req, res, next){
    var username = req.body.username;
    var email = req.body.email;
    var pass = secret.sha1(req.body.pass);
    var userId = req.user.id;

    var user = mongo.user();
    user.update({_id:new ObjectID(userId)}, {$set:{username:username, email:email, password:pass}}, function(err){
        if(err) return next(err);
        res.redirect('/vp/u/home');
    });

};

router.get('/u/us2', userSignup2);
router.post('/u/us2', handleUserSignup2);
router.get('/u/home', getHome);


module.exports = router;