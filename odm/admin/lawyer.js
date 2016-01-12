/**
 * Created by Daniels on 2015/10/17.
 */
var Lawyer  = require('../../model/lawyer').Lawyer;

exports.getLawyers =  function(start, rows, query, callback){
    if(isNaN(start) || isNaN(rows)) return callback(new Error('Params start & rows must be a digit'));

    start = Number(start) || 0;
    rows  = Number(rows)  || 10;
    return Lawyer.find(query || {}).skip(start).limit(rows).exec(callback);
};

exports.getOneLawyer = function(lawyerId, callback){
    return Lawyer.findOne({_id: lawyerId}, callback);
};

exports.getLawyerByCondition = function(condition, callback){
    if(!condition) condition = {};
    //findOne return null if no data is matched
    return Lawyer.findOne(condition, callback);
};

exports.lawyerCount = function(query, callback){
    return Lawyer.count(query || {}, callback);
};


exports.updateLawyer = function(lawyerId, query, callback){
    return Lawyer.findOneAndUpdate({_id: lawyerId}, {$set: query}, callback);
};