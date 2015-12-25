/**
 * Created by Daniels on 2015/10/17.
 */
var Lawyer  = require('../model/lawyer').Lawyer;

exports.getLawyers =  function(start, rows, callback){
	return Lawyer.find().skip(start).limit(rows).exec(callback);
};

exports.getOneLawyer = function(lawyerId, callback){
	return Lawyer.findOne({_id: lawyerId}, callback);
};

exports.getLawyerByCondition = function(condition, callback){
	if(!condition) condition = {};
	//findOne return null if no data is matched
	return Lawyer.findOne(condition, callback);
};

exports.lawyerCount = function(callback){
	return Lawyer.count(callback);
};
exports.createLawyer = function(lawyer, callback){

    var pwdHandler = function(err, doc){
        if(doc._doc.password) delete doc._doc.password;
        return callback(err, doc)
    };

    return new Lawyer(lawyer).save(pwdHandler);
};