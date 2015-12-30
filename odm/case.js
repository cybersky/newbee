/**
 * Created by hailongzhao on 10/27/15.
 */

var user = require('../model/case.js');
var config = require('../profile/config.js');
var locale = require('../profile/locales.js');
var mongo = require('../clients/mongo.js');
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');


var assertModifyOne = function(cb){
    return function(err, result){
        if(err) return cb(err);
        cb( result && result.nModified == 1 ? null : 'Not Modified' );
    }
};

var assertMatchOne = function(cb){
    return function(err, result){
        if(err) return cb(err);
        cb( result && result.nMatched == 1 ? null : 'Not Matched' );
    }
};

var assertUpsertOne = function(cb){
    return function(err, result){
        if(err) return cb(err);
        result && result.nUpserted == 1 ? cb(null, result.upsertedId.toString()) : cb('Not Upserted');
    }
};


var assertInsertOne = function(cb){
    return function(err, result){
        if(err) return cb(err);
        result && result.nInserted == 1 ? cb(null, result.insertedId.toString()) : cb('Not Inserted');
    };
};

exports.createCase = function(userCase){

    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    if (_.pluck(config.userCaseType, 'name').indexOf(userCase.caseType) < 0)
        return callback({rtn: config.errorCode.paramError, message: locale.unknowCaseType});

    if (_.pluck(config.userServiceType, 'name').indexOf(userCase.serviceType) < 0)
        return callback({rtn: config.errorCode.paramError, message: locale.unkownServiceType});

    if (!userCase.caseDesc || userCase.caseDesc.length < 20)
        return callback({rtn: config.errorCode.paramError, message: locale.tooShortDesc});

    if (!userCase.caseTarget || userCase.caseTarget.length < 20)
        return callback({rtn: config.errorCode.paramError, message: locale.tooShortTarget});

    if (userCase.price1 && userCase.price2)
        return callback({rtn: config.errorCode.paramError, message: locale.eitherPrice});

    if (userCase.price1 && isNaN(Number(userCase.price1)))
        return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});

    if (userCase.price2 && !isNaN(Number(userCase.price2)) && ( Number(userCase.price2) < 0 || Number(userCase.price2) > 100) )
        return callback({rtn: config.errorCode.paramError, message: locale.price2FormatError});

    if (userCase.lon && isNaN(Number(userCase.lon)))
        return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});

    if (userCase.lat && isNaN(Number(userCase.lat)))
        return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});

    if(!userCase.userOpenId){
        return callback({rtn: config.errorCode.paramError, message: locale.wxOpenIdError});
    }

    userCase.status = config.caseStatus.raw.key;
    userCase.createdAt = new Date();
    userCase.updatedAt = new Date();

    var caseCollection = mongo.case();

    /*
    function(err, result){
        if(err) return callback(err);
        var insertedCount = result.insertedCount;
        var insertedId = result.insertedId;
        var ops = result.ops;
        callback(err, result);
    }
    */
    caseCollection.insertOne(userCase, assertInsertOne(callback));
};

exports.updateCaseByQuery = function(query, caseDoc){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    if (caseDoc.userCaseType && _.pluck(config.userCaseType, 'name').indexOf(caseDoc.caseType) < 0)
        return callback({rtn: config.errorCode.paramError, message: locale.unknowCaseType});

    if (caseDoc.userServiceType && _.pluck(config.userServiceType, 'name').indexOf(caseDoc.serviceType) < 0)
        return callback({rtn: config.errorCode.paramError, message: locale.unkownServiceType});

    if (caseDoc.caseDesc && caseDoc.caseDesc.length < 20)
        return callback({rtn: config.errorCode.paramError, message: locale.tooShortDesc});

    if (caseDoc.caseTarget && caseDoc.caseTarget.length < 20)
        return callback({rtn: config.errorCode.paramError, message: locale.tooShortTarget});

    if (caseDoc.price1 && caseDoc.price2)
        return callback({rtn: config.errorCode.paramError, message: locale.eitherPrice});

    if (caseDoc.price1 && isNaN(Number(caseDoc.price1)))
        return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});

    if (caseDoc.price2 && !isNaN(Number(caseDoc.price2)) && ( Number(caseDoc.price2) < 0 || Number(caseDoc.price2) > 100) )
        return callback({rtn: config.errorCode.paramError, message: locale.price2FormatError});

    if (caseDoc.lon && isNaN(Number(caseDoc.lon)))
        return callback({rtn: config.errorCode.paramError, message: locale.lonFormatError});

    if (caseDoc.lat && isNaN(Number(caseDoc.lat)))
        return callback({rtn: config.errorCode.paramError, message: locale.latFormatError});

    caseDoc.updatedAt = new Date();
    var caseCollection = mongo.case();

    caseCollection.update(query, {$set:caseDoc}, callback);
};

exports.updateOneCase = function(caseId, caseDoc) {
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    caseDoc.updatedAt = new Date();
    exports.updateCaseByQuery({_id:new ObjectID(caseId)}, caseDoc, assertModifyOne(callback) );
};


exports.updateOneCaseByUser = function(caseId, userOpenId, caseDoc){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    caseDoc.updatedAt = new Date();
    exports.updateCaseByQuery({_id:new ObjectID(caseId), userOpenId:userOpenId}, caseDoc, assertModifyOne(callback));
};

exports.updateCaseStatusByLawyer = function(caseId, lawyerOpenId, status){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    if([config.caseStatus.process.key, config.caseStatus.closel.key, config.caseStatus.disputel.key].indexOf(status)){
        return callback({rtn:config.errorCode.paramError, message:'invalid status'});
    }

    caseDoc = {status:status, updatedAt: new Date()};
    exports.updateCaseByQuery({_id:ObjectID(caseId), 'target.lawyerOpenId':lawyerOpenId}, caseDoc, assertModifyOne(callback));
};


exports.cancelCaseByUser = function(caseId, userOpenId){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var caseDoc = {status:config.caseStatus.cancel.key, updatedAt: new Date()};
    exports.updateCaseByQuery({_id:new ObjectID(caseId), userOpenId:userOpenId}, caseDoc, assertModifyOne(callback) );
};


exports.getCaseByServiceType = function(type, option){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var types = _.pluck(config.userServiceType, 'name');
    if( types.indexOf(type) < 0 ) return callback({rtn:config.errorCode.paramError, message:'invalid service type'});

    option = option || {};
    option.sort = option.sort || {createdAt:-1, updatedAt:-1};
    exports.getCase({serviceType:type}, option, callback);
};


exports.getCaseByCaseType = function(type, option){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var types = _.pluck(config.userCaseType, 'name');
    if( types.indexOf(type) < 0 ) return callback({rtn:config.errorCode.paramError, message:'invalid service type'});

    option = option || {};
    option.sort = option.sort || {createdAt:-1, updatedAt:-1};
    exports.getCase({caseType:type}, option, callback);
};


exports.getCaseByStatus = function(state, option){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var states = _.pluck(_.values(config.caseStatus), 'key');
    if( states.indexOf(state) < 0 ) return callback({rtn:config.errorCode.paramError, message:'invalid case state'});

    option = option || {};
    option.sort = option.sort || {createdAt:-1, updatedAt:-1};
    exports.getCase({status:state}, option, callback);
};




exports.getCase = function(query, option){

    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var caseCollection = mongo.case();

    var cursor = caseCollection.find(query);

    if(option && option.sort) cursor.sort(option.sort);
    if(option && option.skip) cursor.skip(Number(option.skip));
    if(option && option.limit) cursor.limit(Number(option.limit));

    cursor.toArray(callback);

};


exports.syncCaseBids = function(caseId){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function'){
        callback = function(err, result){
            if(err) return console.error('sync case bids error', err);
            console.log('sync case ok', caseId, 'nMatched', result.nMatched, 'nModified', result.nModified);
        };
    }

    var cases = mongo.case();
    var bids = mongo.bid();

    async.waterfall([
        function(cb){
            bids.find({caseId:caseId}).sort({updatedAt:-1}).toArray(cb);
        },
        function(list, cb){
            cases.update({_id:new ObjectID(caseId)}, {$set:{bids:list}}, assertModifyOne(cb));
        }
    ], callback);
};



exports.bidCase = function(caseId, bidDoc){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    if(!bidDoc.lawyerOpenId) return callback({rtn:config.errorCode.paramError, message:'lawyerOpenId required'});
    if(!bidDoc.lyInfo) return callback({rtn:config.errorCode.paramError, message:'lawyer info required'});

    if(!bidDoc.price1 || !bidDoc.price2) return callback({rtn:config.errorCode.paramError, message:locale.noBidPrice});
    if(bidDoc.price1 && bidDoc.price2) return callback({rtn:config.errorCode.paramError, message:locale.eitherBidPrice});

    var cases = mongo.case();
    var bids = mongo.bid();

    var bidId;

    async.waterfall([
        function(cb){
            //cases.findOneAndUpdate({_id:new ObjectID(caseId)}, {$set:{status:config.caseStatus.bid.key}}, cb);
            cases.findOne({_id:new ObjectID(caseId)}, cb);
        },
        function(userCase, cb){
            if(!userCase) return cb({rtn:config.errorCode.paramError, message:locale.noSuchCase+caseId});

            if([config.caseStatus.online.key, config.caseStatus.bid.key].indexOf(userCase.status) < 0){
                return cb({rtn:config.errorCode.paramError, message:'案件已经结束投标'+caseId});
            }

            bids.find({caseId:caseId, lawyerOpenId:bidDoc.lawyerOpenId}, cb);
        },
        function(bid, cb){
            if(bid) return cb({rtn:config.errorCode.paramError, message:'重复投标'});

            bidDoc.caseId = caseId;
            bidDoc.createdAt = new Date();
            bidDoc.updatedAt = new Date();

            bids.insertOne(bidDoc, assertInsertOne(cb));
        },
        function(id, cb){
            bidId = id;
            exports.syncCaseBids(caseId, cb);
        },
        function(cb){
            cb(null, bidId);
        }
    ], callback);
};


exports.updateBid = function(bidId, bidDoc, openId){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    if(bidDoc.price1 && bidDoc.price2) return callback({rtn:config.errorCode.paramError, message:locale.eitherBidPrice});

    if(bidDoc.price1 && isNaN(Number(bidDoc.price1))) callback({rtn:config.errorCode.paramError, message:'price1 Error'});
    if(bidDoc.price2 && isNaN(Number(bidDoc.price2)) && (Number(bidDoc.price2) >= 100 || Number(bidDoc.price2) <= 0 )  ) callback({rtn:config.errorCode.paramError, message:'price2 Error'});

    var bids = mongo.bid();
    bidDoc.updatedAt = new Date();

    async.waterfall([
        function(cb){
            bids.findOneAndUpdate({_id:ObjectID(bidId), lawyerOpenId:openId}, {$set:bidDoc}, {returnOriginal:false}, cb);
        },
        function(result, cb){
            if(!result.value) return cb({rtn:config.errorCode.paramError, message:locale.noSuchBid});
            exports.syncCaseBids(result.value.caseId, cb);
        }
    ], callback);

};

exports.deleteBid = function(bidId, openId){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');


    var bids = mongo.bid();

    async.waterfall([
        function(cb){
            bids.findOneAndDelete({_id:ObjectID(bidId), lawyerOpenId:openId}, cb);
        },
        function(result, cb){
            if(!result.value) return cb({rtn:config.errorCode.paramError, message:locale.noSuchBid});
            exports.syncCaseBids(result.value.caseId, cb);
        }
    ], callback);

};

exports.getLawyerBidCases = function(openId){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var bids = mongo.bid();
    var cases = mongo.case();

    async.waterfall([
        function(cb){
            bids.find({lawyerOpenId:openId}).sort({createdAt:-1}).toArray(cb);
        },
        function(bids, cb){
            if(!bids || bids.length == 0) return cb(null, bids);

            var caseIds = _.pick(bids, 'caseId').map( caseId => ObjectID(caseId) );
            cases.find({_id:{$in:caseIds}}, cb);
        }

    ], callback);
};

exports.targetCaseByUser = function(caseId, bidId){
    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var cases = mongo.case();
    var bids = mongo.bid();

    async.waterfall([
        function(cb){
            bids.findOne({_id:ObjectID(bidId)}, cb);
        },
        function(bid, cb){
            if(!bid) return next({rtn:config.errorCode.paramError, message:locale.noSuchBid+bidId});
            cases.updateOne({_id:ObjectID(caseId)}, {$set:{target:bid}}, cb);
        }
    ], assertModifyOne(callback) );

};