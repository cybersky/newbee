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

router.get('/lawyer', getLawyers);
router.get('/lawyer/:lawyerId', getOneLawyer);
router.put('/lawyer/update/:lawyerId', updateLawyer);
router.delete('/lawyer/delete/:lawyerId', deleteLawyer);


module.exports = router;
