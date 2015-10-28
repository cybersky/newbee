/**
 * Created by Daniels on 10/19/15.
 */
var express = require('express');
var router = express.Router();
var Lawyer	= require('../odm/lawyer');
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secret');
var middleware = require('../middleware/uploader');


validator.authId = function(id){
    if(!id) return false;
    var re = new RegExp(/^[1-9]\d{16}[\d|x|X]$/g);
    return re.test(id);
};

var LawyerRegister = (req, res, next) => {
    var files = req.files || {};
    if(!files['lawyerIdImage']) return res.send({code: 1 , message: 'Missing lawyer id image'});
    if(!files['identityImage']) return res.send({code: 1 , message: 'Missing identity image'});
    var lawyer = {};
    lawyer.username 		= _.trim(req.body['username'])  		|| '';
    lawyer.password 		= _.trim(req.body['password'])  		|| '';
    lawyer.email	  		= _.trim(req.body['email'])				|| '';
    lawyer.phoneNumber	= _.trim(req.body['phoneNumber'])       || '';
    lawyer.identityNumber = _.trim(req.body['identityNumber'])    || '';
    lawyer.identityFilename = '/upload/' + files.identityImage[0].filename;
    lawyer.lawyerIdFilename = '/upload/' + files.lawyerIdImage[0].filename;
    lawyer.lawyerId       = _.trim(req.body['lawyerId'])          || '';
    lawyer.lawyerLocation = _.trim(req.body['lawyerLocation']);
    lawyer.lawServiceArea = _.trim(req.body['lawServiceArea']);


    var err = '';
    if(!lawyer.username) err			= 'User name can not be empty';
    if(!lawyer.password) err			= 'Password can not be empty';
    if(!lawyer.email)	   err			= 'Email can not be empty';
    if(!validator.isEmail(lawyer.email)) err = 'Email format error';
    if(!lawyer.phoneNumber)err		= 'Phone number can not be empty';
    if(!validator.isMobilePhone(lawyer.phoneNumber, 'zh-CN')) err = 'Phone number error';
    if(!lawyer.lawyerId) err          = 'Lawyer id can not be empty';
    if(!lawyer.identityNumber)err	    = 'Identical Number can not be empty';
    if(!validator.authId(lawyer.identityNumber)) err = 'Identical Number format error';
    if(err) return res.send({rtn: 1, message: err});


    async.waterfall([
        (cb) => {
            //auth post data
            Lawyer.getLawyerByCondition({email: lawyer.email}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'email already exists'});
            Lawyer.getLawyerByCondition({phoneNumber: lawyer.phoneNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'phoneNumber already exists'});
            Lawyer.getLawyerByCondition({identityNumber: lawyer.identityNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'identityNumber already exists'});
            Lawyer.getLawyerByCondition({lawyerId: lawyer.lawyerId}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'lawyer Id already exists'});
            lawyer.password = secure.sha1(lawyer.password, 'utf-8');
            Lawyer.createLawyer(lawyer, cb);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        res.send({rtn: 0, message:'Create Lawyer successful', data: docs});
    });
};


router.post('/lawyer/signup', middleware.uploader(['lawyerIdImage', 'identityImage']) , LawyerRegister);


module.exports = router;