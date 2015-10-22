/**
 * Created by Daniels on 10/19/15.
 */
var express = require('express');
var router = express.Router();
var User	= require('../odm/user');
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secure');
var middleware = require('../middleware/uploader');


var userRegister = (req, res, next) => {
    var files = req.files || {};
    if(!files['lawyerIdImage']) return res.send({code: 1 , message: 'Missing lawyer id image'});
    if(!files['identityImage']) return res.send({code: 1 , message: 'Missing identity image'});
    var user = {};
    user.username 		= _.trim(req.body['username'])  		|| '';
    user.password 		= _.trim(req.body['password'])  		|| '';
    user.email	  		= _.trim(req.body['email'])				|| '';
    user.phoneNumber	= _.trim(req.body['phoneNumber'])       || '';
    user.identityNumber = _.trim(req.body['identityNumber'])    || '';
    user.identityFilename = files.identityImage[0].filename;
    user.lawyerIdFilename = files.lawyerIdImage[0].filename;
    user.lawyerId       = _.trim(req.body['lawyerId'])          || '';
    user.lawyerLocation = _.trim(req.body['lawyerLocation']);
    user.lawServiceArea = _.trim(req.body['lawServiceArea']);


    var err = '';
    if(!user.username) err			= 'User name can not be empty';
    if(!user.password) err			= 'Password can not be empty';
    if(!user.email)	   err			= 'Email can not be empty';
    if(!validator.isEmail(user.email)) err = 'Email format error';
    if(!user.phoneNumber)err		= 'Phone number can not be empty';
    if(!validator.isMobilePhone(user.phoneNumber, 'zh-CN')) err = 'Phone number error';
    if(!user.lawyerId) err          = 'Lawyer id can not be empty';
    if(!user.identityNumber)err	= 'Identical Number can not be empty';
    if(err) return res.send({rtn: 1, message: err});


    async.waterfall([
        (cb) => {
            //auth post data
            User.getUserByCondition({email: user.email}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'email already exists'});
            User.getUserByCondition({phoneNumber: user.phoneNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'phoneNumber already exists'});
            User.getUserByCondition({identityNumber: user.identityNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'identityNumber already exists'});
            User.getUserByCondition({lawyerId: user.lawyerId}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'lawyer Id already exists'});
            user.password = secure.sha1(user.password, 'utf-8');
            User.createUser(user, cb);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        res.send({rtn: 0, message:'Create user successful', data: docs});
    });
};


router.post('/user/signup', middleware.uploader(['lawyerIdImage', 'identityImage']) , userRegister);


module.exports = router;