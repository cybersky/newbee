/**
 * Created by Daniels on 2015/10/17.
 */
var mongoose = require('mongoose');
var config = require('../profile/config');
var UserSchema = require('../model/user').UserSchema;

var uri = config.getMongoUri();
mongoose.connect(uri, function(err){
	if(err) {
		console.log(err);
	}
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

exports.User = mongoose.model('Users', UserSchema);