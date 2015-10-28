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
    if(!files['lawyerIdImage']) return res.send({rtn: 1, code: 1 , message: 'Missing lawyer id image'});
    if(!files['identityImage']) return res.send({rtn: 1, code: 1 , message: 'Missing identity image'});
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
    if(!lawyer.username) err			= '用户名不能为空';
    if(!lawyer.password) err			= '密码不能为空';
    if(!lawyer.email)	   err			= '邮箱不能为空';
    if(!validator.isEmail(lawyer.email)) err = '邮箱格式错误';
    if(!lawyer.phoneNumber)err		    = '手机号码不能为空';
    if(!validator.isMobilePhone(lawyer.phoneNumber, 'zh-CN')) err = '手机号码格式错误';
    if(!lawyer.lawyerId) err            = '律师ID不能为空';
    if(!lawyer.identityNumber)err	    = '身份证号码不能为空';
    if(!validator.authId(lawyer.identityNumber)) err = '身份证号码格式错误';
    if(err) return res.send({rtn: 1, code: 1, message: err});


    async.waterfall([
        (cb) => {
            //auth post data
            Lawyer.getLawyerByCondition({email: lawyer.email}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'邮箱已经被注册'});
            Lawyer.getLawyerByCondition({phoneNumber: lawyer.phoneNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'手机号码已经被注册'});
            Lawyer.getLawyerByCondition({identityNumber: lawyer.identityNumber}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'身份证号码已经被注册'});
            Lawyer.getLawyerByCondition({lawyerId: lawyer.lawyerId}, cb);
        },
        (docs, cb) => {
            if(docs) return cb({rtn: 1, message:'律师执业证号已经被注册'});
            lawyer.password = secure.sha1(lawyer.password, 'utf-8');
            Lawyer.createLawyer(lawyer, cb);
        }
    ], (err, docs) => {
        if(err) return res.send(err);
        res.send({rtn: 0, code:0, message:'Create Lawyer successful', data: docs});
    });
};


router.post('/lawyer/signup', middleware.uploader(['lawyerIdImage', 'identityImage']) , LawyerRegister);


module.exports = router;