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


    var caseCollection = mongo.case();

    caseCollection.update({_id:new ObjectID(caseId)}, {$set:caseDoc}, function(err, result){
        callback(err, result);
    });
};


exports.getCaseByServiceType = function(type){

};


exports.getCaseByCaseType = function(type){

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