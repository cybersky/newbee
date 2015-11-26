/**
 * Created by hailongzhao on 11/21/15.
 */

var express = require('express');
var router = express.Router();
var config  = require('../profile/config');
var auth    = require('../middleware/auth');
var secret = require('../tools/secret');
var mongo = require('../clients/mongo');

var root = (req, res, next) => {
    return res.render('index', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};

var signup = (req, res, next) => {
    return res.render('lawyer/signup', {
        options: {target: 'signup', action:'none'},
        userInfo: req.session.userInfo
    });
};

var signin = (req, res, next) => {
    return res.render('lawyer/signin', {
            options: {target: 'signin', action:'none'},
            userInfo: req.session.userInfo
        }
    )};


var adminSignOut = (req, res, next) => {
    res.clearCookie(config.operatorCookie.name, {path: config.operatorCookie.options.path});
    req.session.destroy();
    return res.redirect('/ap/signin');
};



var lawyerSignOut = (req, res, next) => {
    res.clearCookie(config.cookieConfig.name, {path: config.cookieConfig.options.path});
    req.session.destroy();
    return res.redirect('/');
};
var LawyerLogin = (req, res, next) => {
    var email = req.body['email'] || '';
    var pass  = req.body['password'] || '';

    if(!email) return res.send({rtn: 1, code: 1, message: 'Email can not be empty'});
    if(!validator.isEmail(email)) return res.send({rtn: 1, code: 1, message:'Email format error'});
    if(!pass)  return res.send({rtn: 1, code: 1, message: 'Password can not be empty'});

    async.waterfall([
        (cb) => {
            Lawyer.getLawyerByCondition({email: email}, cb);
        },
        (docs, cb) => {
            if(!docs) return cb({rtn: 1, code: 1,notice:'emailNotice' ,message: 'The Email you typed do not matched'});
            if(secure.sha1(pass, 'utf-8') != docs.password) {
                return cb({rtn: 1, code: 1, notice: 'passwordNotice', message: 'The password you typed do not matched, Please try again'});
            }
            cb(null, docs);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        //login success and distributing the cookie
        //var token = secure.md5(email+config.cookie.privateKey);
        //String(Date.now())+':'+email+':'+docs._id+':'+token
        var token = secure.md5(email+config.cookieConfig.privateKey);
        res.cookie(config.cookieConfig.name, String(Date.now())+':'+email+':'+docs._id+':'+token, config.cookieConfig.options);
        if(docs.password) delete docs._doc.password;

        req.session.userInfo    = docs;
        req.session.lawyerInfo  = docs;
        return res.send({ rtn: 0, message: 'OK', refer: '/'});
    });

};



router.post('/lawyer/signin', LawyerLogin);
router.get('/admin/signout', adminSignOut);
router.get('/', auth.authCookie, root);
router.get('/signup', signup);
router.get('/signin', auth.authLawyerSignIn, signin);
router.get('/user/signout', lawyerSignOut);


var userSignup = function(req, res, next){
    res.render('user/signup');
};

router.get('/us', userSignup);

module.exports = router;