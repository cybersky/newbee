/**
 * Created by hailongzhao on 10/27/15.
 */


var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plugins	= require('./plugins');


//案件表
var CaseSchema = exports.CaseSchema = new Schema({
    raw:{type:String},//案件原始描述，未经过人工整理

    title: { type: String }, //案件标题
    description: { type: String }, //案件描述
    target:{type:String},//诉求描述
    tag:[{type:String}],//案件类型，用tag来标记

    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    askType:{type:String},//奖赏类别 'price' or 'percent'
    price:{ type:Number},//固定金额
    percent:{type:Number}//按比例
});

CaseSchema.plugin(plugins.hiddenFields);
CaseSchema.plugin(plugins.documentDate);

CaseSchema.index({userId: 1});
CaseSchema.index({price: 1});




//案件投标表
var CaseBidSchema = exports.CaseBidSchema = new Schema({
    comment: { type: String },
    lawyerId: { type: Schema.Types.ObjectId, ref: 'Lawyer' },
    caseId: {type: Schema.Types.ObjectId, ref: 'Case'},
    price:{ type:Number},
    percent:{type:Number}
});

CaseBidSchema.plugin(plugins.hiddenFields);
CaseBidSchema.plugin(plugins.documentDate);

CaseBidSchema.index({lawyerId: 1});
CaseBidSchema.index({caseId: 1});



//案件跟进表
var CaseTrackSchema = exports.CaseTrackSchema = new Schema({
    comment: { type: String },
    caseId: {type: Schema.Types.ObjectId, ref: 'Case'},

    //跟进人
    lawyerId: { type: Schema.Types.ObjectId, ref: 'Lawyer' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    opId: { type: Schema.Types.ObjectId, ref: 'Operator' }
});

CaseTrackSchema.plugin(plugins.hiddenFields);
CaseTrackSchema.plugin(plugins.documentDate);

CaseTrackSchema.index({caseId: 1});



exports.Case  = mongoose.model('Case', CaseSchema);
exports.CaseBid  = mongoose.model('CaseBid', CaseBidSchema);
exports.CaseTrack  = mongoose.model('CaseTrack', CaseTrackSchema);
