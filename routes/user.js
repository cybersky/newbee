var express = require('express');
var router = express.Router();
var User	= require('../odm/user');
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secure');


var createUser = function(req, res, next){
	var user = {};
	user.username 		= _.trim(req.body['username'])  		|| '';
	user.password 		= _.trim(req.body['password'])  		|| '';
	user.email	  		= _.trim(req.body['email'])				|| '';
	user.phoneNumber	= _.trim(req.body['phoneNumber'])		|| '';
	user.identityNumber= _.trim(req.body['identityNumber'])	|| '';
	var err = '';
	if(!user.username) err			= 'User name can not be empty';
	if(!user.password) err			= 'Password can not be empty';
	if(!user.email)	   err			= 'Email can not be empty';
	if(!validator.isEmail(user.email)) err = 'Email format error';
	if(!user.phoneNumber)err		= 'Phone number can not be empty';
	if(!validator.isMobilePhone(user.phoneNumber, 'zh-CN')) err = 'Phone number error';
	if(!user.identityNumber)err	= 'Identical Number can not be empty';
	if(err) return res.send({rtn: 1, message: err});


	async.waterfall([
		function(cb){
			//auth post data
			User.getUserByCondition({email: user.email}, cb);
		},
		function(docs, cb){
			if(docs) return cb({rtn: 1, message:'email already exists'});
			User.getUserByCondition({phoneNumber: user.phoneNumber}, cb);
		},
		function(docs, cb){
			if(docs) return cb({rtn: 1, message:'phoneNumber already exists'});
			User.getUserByCondition({identityNumber: user.identityNumber}, cb);
		},
		function(docs, cb){
			if(docs) return cb({rtn: 1, message:'identityNumber already exists'});
			user.password = secure.sha1(user.password, 'utf-8');
			User.createUser(user, cb);
		}
	], function(err, docs){
		if(err) return res.send(err);
		res.send({rtn: 0, message:'Create user successful', data: docs});
	});
};

var getUsers   = function(req, res, next){
	var start = req.query['start'] || 0;
	var rows = req.query['rows'] || 10;

	User.getUsers(start, rows, function(err, docs){
		if(err) return res.send(err);
		res.send({rtn: 0, message: '', data: docs});
	});
};
var getOneUser = function(req, res, next){
	var userId = _.trim(req.params['userId']) || '';
	if(!userId) return res.send({rtn: 1, message:'Missing param userId'});

	User.getOneUser(userId, function(err, docs){
		if(err) return res.send({rtn: 1, message:err});
		res.send({rtn: 0, message: '', data: docs});
	});
};
var updateUser = function(req, res, next){};
var deleteUser = function(req, res, next){};

router.get('/user', getUsers);
router.get('/user/:userId', getOneUser);
router.post('/user/create', createUser);
router.put('/user/update/:userId', updateUser);
router.delete('/user/delete/:userId', deleteUser);


module.exports = router;
