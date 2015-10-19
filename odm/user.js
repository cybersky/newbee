/**
 * Created by Daniels on 2015/10/17.
 */
var User  = require('../clients/mongo').User;


exports.createUser = function(userInfo, callback){
	var user = new User(userInfo);
	return user.save(function(err, docs, effected){
		if(err) return callback(err);
		if(docs.password) delete docs._doc.password;
		return callback(null, docs, effected);
	});
};

exports.getUsers =  function(start, rows, callback){
	return User.find().skip(start).limit(rows).exec(callback);
};

exports.getOneUser = function(userId, callback){
	return User.find({_id: userId}, callback);
};

exports.getUserByCondition = function(condition, callback){
	if(!condition) condition = {};
	//findOne return null if no data is matched
	return User.findOne(condition, callback);
};