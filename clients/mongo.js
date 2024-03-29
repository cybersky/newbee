var mongoose = require('mongoose');
var config = require('../profile/config');
var async = require('async');

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
    users.createIndex({openId:1}, {unique:true, background:true, sparse:true});
    users.createIndex({mobile:1}, {unique:true, background:true, sparse:true});

    var lawyers = newbeeDB.collection('lawyers');
    users.createIndex({openId:1}, {unique:true, background:true, sparse:true});
    users.createIndex({mobile:1}, {unique:true, background:true, sparse:true});

    var cases = newbeeDB.collection('cases');
    cases.createIndex({userOpenId:1}, {background:true});
    cases.createIndex({'location':'2dsphere'}, {});

    var bids = newbeeDB.collection('bids');
    bids.createIndex({lawyerOpenId:1}, {background:true});
    bids.createIndex({caseId:1}, {background:true});
    bids.createIndex({caseId:1, lawyerOpenId:1}, {background:true, unique:true, sparse:false});


    var comments = newbeeDB.collection('comments');
    comments.createIndex({lawyerOpenId:1}, {background:true});
    comments.createIndex({caseId:1}, {background:true});
    comments.createIndex({caseId:1, lawyerOpenId:1}, {background:true, unique:true, sparse:false});

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

exports.bid = function(){
    return newbeeDB.collection('bids');
};


exports.comment = function(){
    return newbeeDB.collection('comments');
};


exports.getIncId = function(name, callback){
    var ids = newbeeDB.collection('ids');

    async.waterfall([
        function(cb){
            ids.findOneAndUpdate({colName:name}, {$inc:{id:1}}, {upsert:false, returnOriginal:false}, cb);
        },
        function(result, cb){
            if(result.value) return callback(null, result.value.id);
            ids.findOneAndUpdate({colName:name}, {$setOnInsert:{id:1000}}, {upsert:true, returnOriginal:false}, cb);
        },
        function(result, cb){
            if(result.value) return callback(null, result.value.id);
        }
    ], callback);

};
