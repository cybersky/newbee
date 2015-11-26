var mongoose = require('mongoose');
var config = require('../profile/config');

var uri = config.getMongoUri();
mongoose.connect(uri, function(err){
	if(err) {
		console.log(err);
	}
	console.log('mongodb is connected to', uri);
});

mongoose.connection.on('open', function(){
	console.log('Server is connected with uri', uri);
});

mongoose.connection.on('error', function(err){
	console.log('Mongodb occurred an error', err);
	process.exit(1);
});

mongoose.connection.on('close', function(){
	console.log('Mongodb connection is closed');
});


var MongoClient = require('mongodb').MongoClient, newbeeDB;

MongoClient.connect(uri, function(err, db) {
	if(err) return console.error('error connect mongodb', err);
	console.log('connected to mongodb', uri);

    newbeeDB.collection(name).ensureIndex('openId', {unique:true, background:true, sparse:true});
    newbeeDB.collection(name).ensureIndex('mobile', {unique:true, background:true, sparse:true});

	exports.db = newbeeDB = db;
});


exports.collection = function(name){
    return newbeeDB.collection(name);
};

exports.user = function(){
    return newbeeDB.collection('users');
};

exports.lawyer = function(){
    return newbeeDB.collection('lawyers');
};

exports.case = function(){
    return newbeeDB.collection('cases');
};

