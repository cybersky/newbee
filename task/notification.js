/**
 * Created by zhaohailong on 12/28/15.
 */
var config = require('../profile/config.js');
var utils = require('../tools/utils.js');
var caseModel = require('../odm/case.js');
var lawyerModel = require('../odm/lawyer.js');

exports.noticeStatus2User = function (caseId, lawyerId, newStatus) {

    async.parallel([
        cb => caseModel.getOneCase(caseId, cb),
        cb => lawyerModel.getOneLawyer(lawyerId, cb)
    ], function(err, result){
        if(err) return console.error('noticeStatus2User error:', err);

        var c = result[0];
        var l = result[1];

        var tempId = config.templateMessageOptions.user.caseStatusNotify.tempId;
        var detailUrl = 'http://51fazhi.com/wp/user/home';
        var data = {};

        switch (newStatus) {
            case config.caseStatus.process.key:
                //TODO: 您的案件律师xxx 已经开始办理，请积极关注进展
                data.first = l.name + '律师已经开始办理您的案件，请积极关注进展';
                data.keyword1 = caseId;
                data.keyword2 = '案件处理中';
                data.remark = '请积极关注案件进展，并保持与'+l.name+'律师沟通，如遇到任何问题请拨打律蜂客户电话xxxxxx.';
                break;
            case config.caseStatus.closel.key:
                //TODO: 案件被律师关闭
                break;
            case config.caseStatus.disputel.key:
                //TODO: 案件被律师投诉
                break;
        }

        utils.sendTemplateMessage(config.optionsUser, c.userOpenId, tempId, detailUrl, data, function() {
            console.log();
        });

    });

};

exports.noticeBid2User = function (caseId, bidId, action) {

    caseModel.getOneBid(bidId, function (err, bid) {
        switch (action) {
            case 'create':
                break;
            case 'update':
                break;
            case 'delete':
                break;
        }
    });
};

exports.noticeStatus2Lawyer = function (caseId, newStatus, oldStatus) {

    switch (newStatus) {
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

exports.noticeStatus2Operator = function (caseId, newStatus, oldStatus) {

};

exports.noticeEvent2User = function (caseId, event) {

    switch (event) {
        case 'comment':
            //TODO: 案件有人评论
            break;
    }

};


exports.noticeEvent2Lawyer = function (caseId, event) {


};