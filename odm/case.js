/**
 * Created by hailongzhao on 10/27/15.
 */

var user = require('../model/case.js');
var config = require('../profile/config.js');
var locale = require('../profile/locales.js');
var mongo = require('../clients/mongo.js');
var ObjectID = require('mongodb').ObjectID;
var _ = require('underscore');

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

    if(!userCase.userOpenId){
        return callback({rtn: config.errorCode.paramError, message: locale.wxOpenIdError});
    }

    userCase.status = config.caseStatus.RAW.key;
    userCase.createdAt = new Date();
    userCase.updatedAt = new Date();

    var caseCollection = mongo.case();

    caseCollection.insertOne(userCase, function(err, result){
        var insertedCount = result.insertedCount;
        var insertedId = result.insertedId;
        var ops = result.ops;
        callback(err, result);
    });
};


exports.updateCase = function(caseId, caseDoc) {

    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var caseCollection = mongo.case();

    caseCollection.update({_id:new ObjectID(caseId)}, {$set:caseDoc}, function(err, result){
        callback(err, result);
    });
};


exports.getCase = function(query, option){

    var callback = arguments[arguments.length-1];
    if(typeof(callback) != 'function') throw new Error('callback should be function.');

    var caseCollection = mongo.case();

    var cursor = caseCollection.find(query);

    if(option && option.sort) cursor.sort(option.sort);
    if(option && option.skip) cursor.skip(option.skip);
    if(option && option.limit) cursor.limit(option.limit);

    cursor.toArray(callback);

};