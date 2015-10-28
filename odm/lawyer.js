/**
 * Created by Daniels on 2015/10/17.
 */
var Lawyer  = require('../model/lawyer').Lawyer;


exports.createLawyer = (lawyerInfo, callback) => {
	var lawyer = new Lawyer(lawyerInfo);
	return lawyer.save((err, docs, effected) => {
		if(err) return callback(err);
		if(docs.password) delete docs._doc.password;
		return callback(null, docs, effected);
	});
};

exports.getLawyers =  (start, rows, callback) => {
	return Lawyer.find().skip(start).limit(rows).exec(callback);
};

exports.getOneLawyer = (lawyerId, callback) => {
	return Lawyer.find({_id: lawyerId}, callback);
};

exports.getLawyerByCondition = (condition, callback) => {
	if(!condition) condition = {};
	//findOne return null if no data is matched
	return Lawyer.findOne(condition, callback);
};

exports.LawyerCount = (callback) => {
	return Lawyer.count(callback);
};