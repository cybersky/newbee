/**
 * Created by hailongzhao on 10/27/15.
 */

var user = require('../model/case.js');
var config = require('../profile/config.js');
var locale = require('../profile/locales.js');
var mongo = require('../clients/mongo.js');
var _ = require('underscore');

exports.createCase = (userCase, callback)=>{

    if (_.pluck(config.userCaseType, 'name').indexOf(userCase.caseType) < 0)
        return callback({rtn: config.errorCode.paramError, message: locale.unknowCaseType});

    if (_.pluck(config.userServiceType, 'name').indexOf(userCase.serviceType) < 0)
        return callback({rtn: config.errorCode.paramError, message: locale.unkownServiceType});

    if (!userCase.caseDesc || userCase.caseDesc.length < 20)
        return callback({rtn: config.errorCode.paramError, message: locale.tooShortDesc});

    if (!userCase.caseTarget || userCase.caseTarget.length < 20)
        return callback({rtn: config.errorCode.paramError, message: locale.tooShortTarget});

    if (userCase.price1 && userCase.price1)
        return callback({rtn: config.errorCode.paramError, message: locale.eitherPrice});

    if (isNaN(Number(userCase.price1)))
        return callback({rtn: config.errorCode.paramError, message: locale.price1FormatError});

    if (isNaN(Number(userCase.price2)) || Number(userCase.price2) < 0 || Number(userCase.price2) > 100)
        return callback({rtn: config.errorCode.paramError, message: locale.price2FormatError});

    if(!userCase.userOpenId){
        return callback({rtn: config.errorCode.paramError, message: locale.wxOpenIdError});
    }

    userCase.status = config.caseStatus.RAW.key;
    userCase.createdAt = new Date();
    userCase.updatedAt = new Date();

    var caseCollection = mongo.case();

    caseCollection.insert(userCase, function(err, result){
        callback(err);
    });
};


exports.updateCase = () => {

};


exports.getCase = () => {

};