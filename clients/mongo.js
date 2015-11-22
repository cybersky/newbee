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
});

mongoose.connection.on('close', function(){
	console.log('Mongodb connection is closed');
});


var MongoClient = require('mongodb').MongoClient;

MongoClient.connect(uri, function(err, db) {
	if(err) return console.error('error connect mongodb', err);

	console.log('connected to mongodb', uri);
	exports.db = db;
});
