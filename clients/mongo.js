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
	if(err){
        console.error('error connect mongodb', err);
        return process.exit(1);
    }

	console.log('connected to mongodb', uri);
	exports.db = newbeeDB = db;

    var users = newbeeDB.collection('users');
    users.ensureIndex('openId', {unique:true, background:true, sparse:true});
    users.ensureIndex('mobile', {unique:true, background:true, sparse:true});

    var lawyers = newbeeDB.collection('lawyers');
    users.ensureIndex('openId', {unique:true, background:true, sparse:true});
    users.ensureIndex('mobile', {unique:true, background:true, sparse:true});
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

