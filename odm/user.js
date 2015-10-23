/**
 * Created by Daniels on 2015/10/17.
 */
var User  = require('../clients/mongo').User;


exports.createUser = (userInfo, callback) => {
	var user = new User(userInfo);
	return user.save((err, docs, effected) => {
		if(err) return callback(err);
		if(docs.password) delete docs._doc.password;
		return callback(null, docs, effected);
	});
};

exports.getUsers =  (start, rows, callback) => {
	return User.find().skip(start).limit(rows).exec(callback);
};

exports.getOneUser = (userId, callback) => {
	return User.find({_id: userId}, callback);
};

exports.getUserByCondition = (condition, callback) => {
	if(!condition) condition = {};
	//findOne return null if no data is matched
	return User.findOne(condition, callback);
};

exports.userCount = (callback) => {
	return User.count(callback);
};