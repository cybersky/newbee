/**
 * Created by hailongzhao on 10/27/15.
 */

var user = require('../model/case.js');
var config = require('../profile/config.js');
var locale = require('../profile/locales.js');
var mongo = require('../clients/mongo.js');
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');
var uuid = require('node-uuid');
var async = require('async');

var assertModifyMany = function (cb, count) {
    return function (err, result) {
        if (err) return cb(err);
        cb(result && result.modifiedCount == count ? null : 'Not All Modified, Expect:' + count + 'Actual:' + result.modifiedCount + ' MatchedCount:' + result.matchedCount);
    }
};

var assertModifyOne = function (cb) {
    return function (err, result) {
        if (err) return cb(err);
        cb(result && result.modifiedCount == 1 ? null : 'Not Modified, Expect:1 Actual:' + result.modifiedCount + ' MatchedCount:' + result.matchedCount);
    }
};

var assertMatchOne = function (cb) {
    return function (err, result) {
        if (err) return cb(err);
        cb(result && result.matchedCount == 1 ? null : 'Not Matched, Expect:1 Actual:' + result.matchedCount + ' MatchedCount:' + result.matchedCount);
    }
};

var assertUpsertOne = function (cb) {
    return function (err, result) {
        if (err) return cb(err);
        result && result.upsertedCount == 1 ? cb(null, result.upsertedId.toString()) : cb('Not Upserted, Expect:1 Actual:' + result.upsertedCount);
    }
};


var assertInsertOne = function (cb) {
    return function (err, result) {
        if (err) return cb(err);
        result && result.insertedCount == 1 ? cb(null, result.insertedId.toString()) : cb('Not Inserted, Expect:1 Actual:' + result.insertedCount);
    };
};


exports.createCase = function (userCase) {

    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

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

    if (userCase.price1) {
        userCase.price1 = Number(userCase.price1);
        if (isNaN(userCase.price1))
            return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});
    }

    if (userCase.price2) {
        userCase.price2 = Number(userCase.price2);
        if (isNaN(userCase.price2) || userCase.price2 < 0 || userCase.price2 > 100)
            return callback({rtn: config.errorCode.paramError, message: locale.price2FormatError});
    }

    if (userCase.lon) {
        userCase.lon = Number(userCase.lon);
        if (isNaN(userCase.lon))
            return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});
    }

    if (userCase.lat) {
        userCase.lat = Number(userCase.lat);
        if (isNaN(userCase.lat))
            return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});
    }


    if (!userCase.userOpenId) {
        return callback({rtn: config.errorCode.paramError, message: locale.wxOpenIdError});
    }

    userCase.status = config.caseStatus.raw.key;
    userCase.bidCount = 0;
    userCase.bids = [];
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

exports.updateOneCaseByQuery = function (query, caseDoc) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

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


    if (caseDoc.price1) {
        caseDoc.price1 = Number(caseDoc.price1);
        if (isNaN(caseDoc.price1))
            return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});
    }

    if (caseDoc.price2) {
        caseDoc.price2 = Number(caseDoc.price2);
        if (isNaN(caseDoc.price2) || caseDoc.price2 < 0 || caseDoc.price2 > 100)
            return callback({rtn: config.errorCode.paramError, message: locale.price2FormatError});
    }

    if (caseDoc.lon) {
        caseDoc.lon = Number(caseDoc.lon);
        if (isNaN(caseDoc.lon))
            return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});
    }

    if (caseDoc.lat) {
        caseDoc.lat = Number(caseDoc.lat);
        if (isNaN(caseDoc.lat))
            return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});
    }


    caseDoc.updatedAt = new Date();
    var caseCollection = mongo.case();

    caseCollection.updateOne(query, {$set: caseDoc}, callback);
};

exports.updateOneCase = function (caseId, caseDoc) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    caseDoc.updatedAt = new Date();
    exports.updateOneCaseByQuery({_id: new ObjectID(caseId)}, caseDoc, assertModifyOne(callback));
};


exports.updateOneCaseByUser = function (caseId, userOpenId, caseDoc) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    caseDoc.updatedAt = new Date();
    exports.updateOneCaseByQuery({
        _id: new ObjectID(caseId),
        userOpenId: userOpenId
    }, caseDoc, assertModifyOne(callback));
};

exports.updateCaseStatusByLawyer = function (caseId, lawyerOpenId, status, comment) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    if ([config.caseStatus.process.key, config.caseStatus.closel.key, config.caseStatus.disputel.key].indexOf(status)) {
        return callback({rtn: config.errorCode.paramError, message: 'invalid status'});
    }
    //it must be the target lawyer change the status
    var query = { _id: ObjectID(caseId), 'target.lawyerOpenId': lawyerOpenId};
    var caseDoc = {status: status, updatedAt: new Date()};

    if(comment) caseDoc['commentOnStatus.'+status] = comment;

    exports.updateOneCaseByQuery(query, caseDoc, assertModifyOne(callback));
};


exports.cancelCaseByUser = function (caseId, userOpenId) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var query = {
        _id: new ObjectID(caseId),
        userOpenId: userOpenId,
        status:{$in:[config.caseStatus.raw.key, config.caseStatus.online.key, config.caseStatus.bid.key, config.caseStatus.target.key ]}
    };

    var caseDoc = {
        status: config.caseStatus.cancel.key,
        updatedAt: new Date()
    };

    exports.updateOneCaseByQuery(query, caseDoc, assertModifyOne(callback));
};


exports.getCaseByServiceType = function (type, option) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var types = _.pluck(config.userServiceType, 'name');
    if (types.indexOf(type) < 0) return callback({rtn: config.errorCode.paramError, message: 'invalid service type'});

    option = option || {};
    option.sort = option.sort || {createdAt: -1, updatedAt: -1};
    exports.getCase({serviceType: type}, option, callback);
};


exports.getCaseByCaseType = function (type, option) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var types = _.pluck(config.userCaseType, 'name');
    if (types.indexOf(type) < 0) return callback({rtn: config.errorCode.paramError, message: 'invalid service type'});

    option = option || {};
    option.sort = option.sort || {createdAt: -1, updatedAt: -1};
    exports.getCase({caseType: type}, option, callback);
};


exports.getCaseByStatus = function (state, option) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var states = _.pluck(_.values(config.caseStatus), 'key');
    if (states.indexOf(state) < 0) return callback({rtn: config.errorCode.paramError, message: 'invalid case state'});

    option = option || {};
    option.sort = option.sort || {createdAt: -1, updatedAt: -1};
    exports.getCase({status: state}, option, callback);
};


exports.getUserCases = function (userOpenId, status) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    if(status && _.keys(config.caseStatus).indexOf(status) < 0)
        return callback({rtn:config.errorCode.paramError, message:"invalid case status:"+status});

    var queryDoc = {userOpenId: userOpenId};
    if(status) queryDoc.status = status;

    exports.getCase(queryDoc, {
        sort: {
            createdAt: -1,
            updatedAt: -1
        }
    }, callback);
};


exports.getCase = function (query, option) {

    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var caseCollection = mongo.case();

    var cursor = caseCollection.find(query);

    if (option && option.sort) cursor.sort(option.sort);
    if (option && option.skip) cursor.skip(Number(option.skip));
    if (option && option.limit) cursor.limit(Number(option.limit));

    cursor.toArray(callback);

};


exports.getOneCase = function (caseId) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var caseCollection = mongo.case();

    caseCollection.findOne({_id: ObjectID(caseId)}, callback);
};


exports.syncCaseBids = function (caseId) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') {
        callback = function (err) {
            if (err) return console.error('sync case bids error', err);
        };
    }

    var cases = mongo.case();
    var bids = mongo.bid();

    async.waterfall([
        function (cb) {
            //TODO: if show the cancel bids???
            bids.find({caseId: caseId, status: {$ne: config.bidStatus.cancel.key}}).sort({updatedAt: -1}).toArray(cb);
        },
        function (list, cb) {
            //TODO: should be assertModifyOne
            cases.updateOne({_id: new ObjectID(caseId)}, {
                $set: {
                    bids: list,
                    bidCount: list.length
                }
            }, assertMatchOne(cb));
        }
    ], callback);
};


exports.syncCaseComments = function (caseId) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') {
        callback = function (err) {
            if (err) return console.error('sync case comments error', err);
        };
    }

    var cases = mongo.case();
    var comments = mongo.comment();

    async.waterfall([
        function (cb) {
            comments.find({caseId: caseId}).sort({updatedAt: -1}).toArray(cb);
        },
        function (list, cb) {
            //TODO: should be assertModifyOne???
            cases.updateOne({_id: new ObjectID(caseId)}, {
                $set: {
                    comments: list,
                    commentCount: list.length
                }
            }, assertMatchOne(cb));
        }
    ], callback);
};


exports.bidCase = function (caseId, bidDoc) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    if (!bidDoc.lawyerOpenId) return callback({rtn: config.errorCode.paramError, message: 'lawyerOpenId required'});
    if (!bidDoc.lawyerInfo) return callback({rtn: config.errorCode.paramError, message: 'lawyer info required'});

    if (!bidDoc.price1 && !bidDoc.price2) return callback({
        rtn: config.errorCode.paramError,
        message: locale.noBidPrice
    });
    if (bidDoc.price1 && bidDoc.price2) return callback({
        rtn: config.errorCode.paramError,
        message: locale.eitherBidPrice
    });

    var cases = mongo.case();
    var bids = mongo.bid();

    var bidId;

    async.waterfall([
        function (cb) {
            var query = {_id:new ObjectID(caseId), status:{$in:[config.caseStatus.online.key, config.caseStatus.bid.key]}};
            cases.findOneAndUpdate(query, {$set:{status:config.caseStatus.bid.key, updatedAt:new Date()}}, cb);
        },
        function (result, cb) {
            if (!result.value) return cb({rtn: config.errorCode.paramError, message: locale.noSuchCase + caseId});

            bids.findOne({caseId: caseId, lawyerOpenId: bidDoc.lawyerOpenId}, cb);
        },
        function (bid, cb) {
            if (bid) return cb({rtn: config.errorCode.paramError, message: '此案您已经投标成功'});

            bidDoc.caseId = caseId;
            bidDoc.status = config.bidStatus.wait.key;
            bidDoc.createdAt = new Date();
            bidDoc.updatedAt = new Date();

            bids.insertOne(bidDoc, assertInsertOne(cb));
        },
        function (id, cb) {
            bidId = id;
            exports.syncCaseBids(caseId, cb);
        },
        function (cb) {
            cb(null, bidId);
        }
    ], callback);
};


exports.updateBid = function (bidId, bidDoc, openId) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    if (bidDoc.price1 && bidDoc.price2) return callback({
        rtn: config.errorCode.paramError,
        message: locale.eitherBidPrice
    });

    if (bidDoc.price1 && isNaN(Number(bidDoc.price1))) callback({
        rtn: config.errorCode.paramError,
        message: 'price1 Error'
    });
    if (bidDoc.price2 && isNaN(Number(bidDoc.price2)) && (Number(bidDoc.price2) >= 100 || Number(bidDoc.price2) <= 0 )) callback({
        rtn: config.errorCode.paramError,
        message: 'price2 Error'
    });

    var bids = mongo.bid();
    bidDoc.updatedAt = new Date();
    var bid;

    async.waterfall([
        function (cb) {
            bids.findOneAndUpdate({
                _id: ObjectID(bidId),
                lawyerOpenId: openId
            }, {$set: bidDoc}, {returnOriginal: false}, cb);
        },
        function (result, cb) {
            if (!result.value) return cb({rtn: config.errorCode.paramError, message: locale.noSuchBid});
            bid = result.value;
            exports.syncCaseBids(result.value.caseId, cb);
        },
        function (cb) {
            cb(null, bid.caseId);
        }
    ], callback);

};

exports.deleteBid = function (bidId, openId) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var bids = mongo.bid();
    var bidDoc = {updatedAt: new Date(), status: config.bidStatus.cancel.key};
    var bid;

    async.waterfall([
        function (cb) {
            bids.findOneAndUpdate({_id: ObjectID(bidId), lawyerOpenId: openId}, {$set: bidDoc}, cb);
        },
        function (result, cb) {
            if (!result.value) return cb({rtn: config.errorCode.paramError, message: locale.noSuchBid});
            bid = result.value;
            exports.syncCaseBids(result.value.caseId, cb);
        },
        function (cb) {
            cb(null, bid.caseId);
        }
    ], callback);

};

exports.getLawyerBids = function (openId, status) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    if (status && [config.bidStatus.wait.key, config.bidStatus.win.key, config.bidStatus.fail.key, config.bidStatus.cancel.key].indexOf(status) < 0)
        return callback({rtn: config.errorCode.paramError, message: 'error bid status:' + status});

    var bids = mongo.bid();
    var cases = mongo.case();

    var bidsList;

    async.waterfall([
        function (cb) {
            var query = {lawyerOpenId: openId};
            if( status ) query.status = status;
            bids.find(query).sort({updatedAt: -1}).toArray(cb);
        },
        function (bids, cb) {
            if (!bids || bids.length == 0) return callback(null, bids);

            bidsList = bids;
            var caseIds = _.map(bids, bid => ObjectID(bid.caseId));
            cases.find({_id: {$in: caseIds}}).toArray(cb);
        },
        function (cases, cb) {
            //we have to build the map to keep id in order.
            var caseMap = {};
            _.each(cases, c => caseMap[c._id.toString()] = c);
            _.each(bidsList, b => b.case = caseMap[b.caseId]);
            cb(null, bidsList);
        }

    ], callback);
};

exports.targetCaseByUser = function (caseId, openId, bidId) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    var cases = mongo.case();
    var bids = mongo.bid();

    async.waterfall([
        function (cb) {
            var updateDoc = {
                updatedAt: new Date(),
                status: config.bidStatus.win.key
            };

            bids.findOneAndUpdate({_id: ObjectID(bidId), status: config.bidStatus.wait.key}, {$set:updateDoc}, cb);
        },
        function (result, cb) {
            var bid = result.value;
            if (!bid) return next({rtn: config.errorCode.paramError, message: locale.noSuchBid + bidId});

            var caseDoc = {
                target: bid,
                updatedAt: new Date(),
                status: config.caseStatus.target.key
            };
            //update case status
            cases.updateOne({_id: ObjectID(caseId), userOpenId: openId}, {$set: caseDoc}, assertModifyOne(cb));
        },
        function(cb){
            var bidDoc = {updatedAt:new Date, status:config.bidStatus.fail.key};
            //update all other bids
            bids.updateMany({caseId:caseId, status:config.bidStatus.wait.key}, {$set:bidDoc}, cb);
        }
    ], callback);

};


exports.commentCase = function (caseId, comment, userInfo, userRole, to) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    if (!caseId) return callback({rtn: config.errorCode.paramError, message: 'no caseId found'});
    if (!comment) return callback({rtn: config.errorCode.paramError, message: 'no comment found'});
    if (comment.length > 500) return callback({
        rtn: config.errorCode.paramError,
        message: 'comment text larger than 500'
    });
    if (!userInfo) return callback({rtn: config.errorCode.paramError, message: 'no userInfo found'});
    if (!userRole) return callback({rtn: config.errorCode.paramError, message: 'no userRole found'});


    var comments = mongo.comment();
    var commentId;

    async.waterfall([
        function (cb) {
            comments.insertOne({
                caseId: caseId,
                text: comment,
                user: userInfo,
                role: userRole,
                to: to
            }, assertInsertOne(cb));
        },
        function (commentId, cb) {
            exports.syncCaseComments(caseId, cb);
        },
        function (cb) {
            cb(null, commentId);
        }

    ], callback);

};


exports.batchOnline = function (caseIds) {
    var callback = arguments[arguments.length - 1];
    if (typeof(callback) != 'function') throw new Error('callback should be function.');

    if(caseIds.length == 0) return callback();
    var cases = mongo.case();

    var batch = cases.initializeUnorderedBulkOp();
    _.each(caseIds, function(c){
        batch.find({_id:ObjectID(c.caseId)}).updateOne({$set:{status:config.caseStatus.online.key, rank:c.rank}});
    });
    batch.execute(function(err, result){
        if(err) return callback(err);
        callback(result.nModified == caseIds.length ? null : {rtn:config.errorCode.serviceError, message:'not modified ' + caseIds.length});
    });
};


exports.countCaseByStatus = function (status, callback) {
    if (!status) return new Error('status can not be empty');
    return mongo.case().count({status: status}, callback);
};