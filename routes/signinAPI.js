/**
 * Created by Daniels on 10/19/15.
 */
var express = require('express');
var router = express.Router();
var User	= require('../odm/user');
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secret');
var middleware = require('../middleware/uploader');
var config  = require('../profile/config');


var userLogin = (req, res, next) => {
    var email = req.body['email'] || '';
    var pass  = req.body['password'] || '';

    if(!email) return res.send({rtn: 1, message: 'Email can not be empty'});
    if(!validator.isEmail(email)) return res.send({code: 1, message:'Email format error'});
    if(!pass)  return res.send({rtn: 1, message: 'Password can not be empty'});

    async.waterfall([
        (cb) => {
            User.getUserByCondition({email: email}, cb);
        },
        (docs, cb) => {
            if(!docs) return cb({rtn: 1, notice:'emailNotice' ,message: 'The Email you typed do not matched'});
            if(secure.sha1(pass, 'utf-8') != docs.password) {
                return cb({rtn: 1, notice: 'passwordNotice', message: 'The password you typed do not matched, Please try again'});
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

        docs._doc.is_admin = false;
        if(config.superUser.email.indexOf(docs.email) >= 0){
            docs._doc.is_admin = true;
        }
        req.session.userInfo = docs;
        return res.send({ rtn: 0, message: 'OK', refer: '/'});
    });

};

router.post('/user/signin', userLogin);


module.exports = router;