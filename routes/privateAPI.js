var express = require('express');
var router = express.Router();
var Lawyer	= require('../odm/lawyer');
var async	= require('async');
var _		= require('lodash');
var validator=require('validator');
var secure	= require('../tools/secret');

var getLawyers   = function(req, res, next){
	var start = req.query['start'] || 0;
	var rows = req.query['rows'] || 10;

	var ct = '';
	async.waterfall([
		(cb) => {
			Lawyer.LawyerCount(cb);
		},
		(count, cb) => {
			ct = count;
			Lawyer.getLawyers(start, rows, cb);
		}
	], (err, docs) => {
		if(err) return res.send(err);
		res.send({rtn: 0, message: '', total: ct, data: docs});
	});

};
var getOneLawyer = function(req, res, next){
	var LawyerId = _.trim(req.params['lawyerId']) || '';
	if(!LawyerId) return res.send({rtn: 1, message:'Missing param LawyerId'});

	Lawyer.getOneLawyer(LawyerId, function(err, docs){
		if(err) return res.send({rtn: 1, message:err});
		res.send({rtn: 0, message: '', data: docs});
	});
};
var updateLawyer = function(req, res, next){};
var deleteLawyer = function(req, res, next){};

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


router.get('/lawyer', getLawyers);
router.get('/lawyer/:lawyerId', getOneLawyer);
router.put('/lawyer/update/:lawyerId', updateLawyer);
router.delete('/lawyer/delete/:lawyerId', deleteLawyer);


module.exports = router;
