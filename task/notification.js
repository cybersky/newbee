/**
 * Created by zhaohailong on 12/28/15.
 */
var config = require('../profile/config.js');
var utils = require('../tools/utils.js');
var caseModel = require('../odm/case.js');
var lawyerModel = require('../odm/lawyer.js');
var moment = require('moment');

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
                data.first = l.name + '律师已经开始办理您的案件，请积极关注进展';
                data.keyword1 = c.sid;
                data.keyword2 = '案件处理中';
                data.remark = '请积极关注案件进展，并保持与'+l.name+'律师沟通，如遇到任何问题请拨打律蜂客户电话xxxxxx.';
                break;
            case config.caseStatus.closel.key:
                data.first = l.name + '律师关闭了您的案件，请稍后对TA的服务进行评价';
                data.keyword1 = c.sid;
                data.keyword2 = '律师已关闭';
                data.remark = '请确保'+l.name+'律师已经帮助您解决了问题，如遇到任何问题请拨打律蜂客户电话xxxxxx.';
                break;
            case config.caseStatus.disputel.key:
                data.first = l.name + '律师投诉了您的案件';
                data.keyword1 = c.sid;
                data.keyword2 = '律师已投诉';
                data.remark = '客服稍后会跟您联系协调解决，如遇到任何问题请拨打律蜂客户电话xxxxxx.';
                break;
        }

        utils.sendTemplateMessage(config.optionsUser, c.userOpenId, tempId, detailUrl, data, function(err) {
            console.log('noticeStatus2User status:', err);
        });

    });

};

exports.noticeBid2User = function (caseId, bidId, action) {

    caseModel.getOneBid(bidId, function (err, bid) {

        var tempId = config.templateMessageOptions.user.caseBidNotify.tempId;
        var detailUrl = 'http://51fazhi.com/wp/user/home';
        var data = {};
        var userOpenId = bid.userOpenId;

        switch (action) {
            case 'create':
                data.first = '您的案件有新的竞标';
                data.keyword1 = moment(bid.createdAt).format('YYYY年MM月DD日 HH:mm A');
                data.keyword2 = bid.lawyerInfo.name;
                data.keyword3 = bid.price1 + '元' || bid.price2 + '%';
                data.remark = '请在指定时间内选择您的竞标服务律师，逾期(7日)未确定律师的案件将自动关闭';
                break;
            case 'update':
                data.first = '您的案件有律师修改竞标';
                data.keyword1 = moment(bid.createdAt).format('YYYY年MM月DD日 HH:mm A');
                data.keyword2 = bid.lawyerInfo.name;
                data.keyword3 = bid.price1 + '元' || bid.price2 + '%';
                data.remark = '请在指定时间内选择您的竞标服务律师，逾期(7日)未确定律师的案件将自动关闭';
                break;
            case 'delete':
                data.first = '您的案件有律师撤掉竞标';
                data.keyword1 = moment(bid.createdAt).format('YYYY年MM月DD日 HH:mm A');
                data.keyword2 = bid.lawyerInfo.name;
                data.keyword3 = bid.price1 + '元' || bid.price2 + '%';
                data.remark = '请在指定时间内选择您的竞标服务律师，逾期(7日)未确定律师的案件将自动关闭';
                break;
        }

        utils.sendTemplateMessage(config.optionsLawyer, userOpenId, tempId, detailUrl, data, function(err){
            console.log('noticeBid2User status:', err);
        });

    });
};

exports.noticeStatus2Lawyer = function (caseId, newStatus) {

    caseModel.getOneCase(caseId, function(err, c){
        if(err ) return console.error('noticeStatus2Lawyer', err);

        var detailUrl = 'http://51fazhi.com/wp/lawyer/home';
        var caseSid = c.sid;
        var bids = c.bids;

        if(!bids || bids.length == 0 ) return;

        var lyOpenIds = _.map(bids, b => b.lawyerOpenId );
        var targetLyOpenId = c.target && c.target.lawyerOpenId;


        var notifyLawyer = function(lyOpenId, cb){

            var tempId;
            var data = {};
            var hasTarget = targetLyOpenId != null;
            var isTarget = lyOpenId == targetLyOpenId;

            switch (newStatus) {
                case config.caseStatus.bid.key:
                    //TODO: if notify in bid phase???
                    break;

                case config.caseStatus.cancel.key:
                    if(hasTarget && !isTarget) return cb();//如果已经中标，且用户没有中标，略过

                    tempId = config.templateMessageOptions.lawyer.caseCancelNotify.tempId;
                    data.first = '您所竞标的案件已被用户取消';
                    data.keyword1 = caseSid;
                    data.keyword2 = c.commentOnStatus.cancel;
                    data.keyword3 = moment(c.updatedAt).format('YYYY年MM月DD日 HH:mm A');
                    data.remark = '由于案情出现变化导致用户取消招标';
                    break;

                case config.caseStatus.target.key:
                    tempId = config.templateMessageOptions.lawyer.bidCompleteNofity.tempId;

                    data.first = isTarget ? '恭喜你，你已经被用户指定为服务律师': '很遗憾，用户已经选择了其他竞标律师';
                    data.keyword1 = caseSid;
                    data.keyword2 = moment(c.updatedAt).format('YYYY年MM月DD日 HH:mm A');
                    data.keyword3 = c.bids.length;
                    data.remark = isTarget ? '请在指定时间内(12小时)及时与用户联系，祝办理顺利' : '再接再厉';
                    break;

                case config.caseStatus.closeu.key:
                    //TODO: 案件被用户关闭
                    if( !isTarget ) return cb();//只通知中标律师
                    tempId = config.templateMessageOptions.lawyer.caseStatusNotify.tempId;

                    data.first = isTarget ? '恭喜你，你已经被用户指定为服务律师': '很遗憾，用户已经选择了其他竞标律师';
                    data.keyword1 = caseSid;
                    data.keyword2 = moment(c.updatedAt).format('YYYY年MM月DD日 HH:mm A');
                    data.keyword3 = c.bids.length;
                    data.remark = isTarget ? '请在指定时间内(12小时)及时与用户联系，祝办理顺利' : '再接再厉';
                    break;
            }

            utils.sendTemplateMessage(config.optionsLawyer, lyOpenId, tempId, detailUrl, data, cb);
        };

        //if not target, notify all the bid lawyers
        async.eachLimit(lyOpenIds, 1, notifyLawyer, function(err){
            console.log('noticeStatus2Lawyer status: ', err);
        });

    });

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