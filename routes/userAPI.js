var express = require('express');
var router = express.Router();
var User	= require('../odm/user');
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secret');

var getUsers   = function(req, res, next){
	var start = req.query['start'] || 0;
	var rows = req.query['rows'] || 10;

	var ct = '';
	async.waterfall([
		(cb) => {
			User.userCount(cb);
		},
		(count, cb) => {
			ct = count;
			User.getUsers(start, rows, cb);
		}
	], (err, docs) => {
		if(err) return res.send(err);
		res.send({rtn: 0, message: '', total: ct, data: docs});
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
router.put('/user/update/:userId', updateUser);
router.delete('/user/delete/:userId', deleteUser);


module.exports = router;
