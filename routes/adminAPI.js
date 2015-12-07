/**
 * Created by Daniels on 10/28/15.
 */
var express = require('express');
var router = express.Router();
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secret');
var Operator = require('../odm/operator');
var config  = require('../profile/config');


var adminLogin = (req, res, next) => {
    var email = req.body['email'] || '';
    var pass  = req.body['password'] || '';

    if(!email) return res.send({rtn: 1, code: 1, message: 'Email can not be empty'});
    if(!validator.isEmail(email)) return res.send({rtn: 1, code: 1, message:'Email format error'});
    if(!pass)  return res.send({rtn: 1, code: 1, message: 'Password can not be empty'});

    async.waterfall([
        (cb) => {
            Operator.getOperatorByCondition({email: email}, cb);
        },
        (docs, cb) => {
            if(!docs) return cb({rtn: 1, code: 1, notice:'emailNotice' ,message: 'The Email you typed do not matched'});
            if(secure.sha1(pass, 'utf-8') != docs.password) {
                return cb({rtn: 1, code: 1, notice: 'passwordNotice', message: 'The password you typed do not matched, Please try again'});
            }
            cb(null, docs);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        var token = secure.md5(email+config.operatorCookie.privateKey);
        res.cookie(config.operatorCookie.name, String(Date.now())+':'+email+':'+docs._id+':'+token, config.operatorCookie.options);
        if(docs.password) delete docs._doc.password;

        req.session.adminInfo    = docs;
        return res.send({ rtn: 0, message: 'OK', refer: '/ap/manager'});
    });
};
router.post('/signin', adminLogin);


module.exports = router;