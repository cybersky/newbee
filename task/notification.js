/**
 * Created by zhaohailong on 12/28/15.
 */
var config = require('../profile/config.js');


exports.noticeStatus2User = function(caseId, newStatus, oldStatus){

    switch (newStatus){
        case config.caseStatus.bid.key:
            //TODO: 您的案件已经有律师竞标，马上去看看吧
            break;
        case config.caseStatus.process.key:
            //TODO: 您的案件律师xxx 已经开始办理，请积极关注进展
            break;
        case config.caseStatus.closel.key:
            //TODO: 案件被律师关闭
            break;
    }

};

exports.noticeStatus2Lawyer = function(caseId, newStatus, oldStatus){

    switch (newStatus){
        case config.caseStatus.bid.key:
            //TODO: 您关注的案件已经有律师竞标，马上去看看吧
            break;
        case config.caseStatus.target.key:
            //TODO: 您的案件律师xxx 已经开始办理，请积极关注进展
            break;
        case config.caseStatus.closeu.key:
            //TODO: 案件被用户关闭
            break;
    }
};

exports.noticeStatus2Operator = function(caseId, newStatus, oldStatus){

};

exports.noticeEvent2User = function(caseId, event){

    switch(event){
        case 'comment':
            //TODO: 案件有人评论
            break;
    }

};


exports.noticeEvent2Lawyer = function(caseId, event){



};