/**
 * Created by zhaohailong on 12/15/15.
 */

exports.unknowCaseType = '错误未知的案件类型';
exports.unkownServiceType = '错误未知的案件服务类型';
exports.tooShortDesc = '案件描述太少啦，至少写二十个字吧';
exports.tooShortTarget = '诉求描述太少啦，至少写二十个字吧';
exports.eitherPrice = '只能有一种悬赏方式';
exports.eitherBidPrice = '只能有一种竞标价格方式';
exports.price1FormatError = '悬赏金额要用数值';
exports.price2FormatError = '悬赏百分比错误(0-100)';
exports.latFormatError = '纬度数据错误';
exports.lonFormatError = '经度数据错误';
exports.wxOpenIdError = 'OpenId错误';
exports.noSuchCase = '无法找到案件';
exports.noSuchBid = '无法找到竞标';
exports.noBidPrice = '请选择至少一种竞价方式';

exports.email = {empty: '邮箱不能为空', formatError: '邮箱格式错误', notMatched: '邮箱不存在'};
exports.password = {
    empty:'密码不能为空',
    mistookPwd: '密码错误',
    notMatched: '密码不匹配'
};
exports.lawyer = {emptyId: '律师ID不能为空', rejectMsgEmpty: '拒绝审核理由不能为空'};
exports.operator = {
    emptyId: '用户ID不能为空', usernameEmpty: '用户名不能为空',
    levelEmpty: '用户权限等级不能为空', illegalLevel: '非法用户等级',
    illegalOperation: '系统不允许此操作'
};

exports.case = {
    emptyId: '案件ID不能为空', rejectMsgEmpty: '拒绝审核理由不能为空'
};

