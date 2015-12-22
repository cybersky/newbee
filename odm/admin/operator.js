/**
 * Created by Daniels on 10/28/15.
 */

var Operator  = require('../../model/operator').Operator;


exports.createOperator = function(operatorInfo, callback){
	var operator = new Operator(operatorInfo);
	return operator.save(function(err, docs, effected){
		if(err) return callback(err);
		if(docs.password) delete docs._doc.password;
		return callback(null, docs, effected);
	});
};

exports.getOperators= function(start, rows, callback){
	start = start || 0;
	rows  = rows  || 10;
	return Operator.find().skip(start).limit(rows).exec(callback);
};
exports.getOperatorById = function(operatorId, callback){
	if(!operatorId) return callback({code: 1, message: 'The operator id can not be found'});
	var condition = {'_id': operatorId};
	return Operator.findOne(condition, callback);
};
exports.getOperatorByCondition = function(query, callback) {
	query = query || {};
	return Operator.findOne(query, callback);
};
exports.operatorCount = function(callback){
	return Operator.count(callback);
};

exports.removeOperator = function(operatorId, callback){
    if(!operatorId) return callback('invalid operator id');
    return Operator.findOneAndRemove({_id: operatorId}, callback);
};
exports.updateOperator = function(operatorId, data, callback){
    if(!operatorId) return callback('invalid operator id');
    return Operator.findOneAndUpdate({_id: operatorId}, {$set: data || {}}, callback);
};