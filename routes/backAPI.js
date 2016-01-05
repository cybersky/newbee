/**
 * Created by zhaohailong on 1/4/16.
 */

var express = require('express');
var router  = express.Router();
var Lawyer  = require('../odm/lawyer');
var async   = require('async');
var _   = require('lodash');
var validator   =require('validator');
var secure  = require('../tools/secret');
var middleware  = require('../middleware/uploader');
var request = require('request');
var redisClient   = require('../clients/redis').client;
var config  = require('../profile/config');
var utils   = require('../tools/utils');
var uuid = require('node-uuid');
var caseModel = require('../odm/case.js');


var createTestUser = function(role){

    return function(req, res, next){
        var openId = uuid.v1();
        res.cookie('openId', openId, {maxAge: 24 * 3600 * 1000, signed: true});
        res.cookie('role', role, {maxAge: 24 * 3600 * 1000, signed: true});

        var nameList = ["马旭", "马振川", "王万宾", "王小珂", "王文京", "王尔乘", "王全", "王安顺", "王岐山", "王青海", "王炳深", "王晓初", "王铮", "王蓉蓉", "巨晓林", "方新", "邓中翰", "冯乐平", "朱良玉", "朱惠刚", "刘忠军", "刘晓晨", "刘新成", "闫傲霜", "池强", "苏辉", "杜德印", "李士祥", "李大进", "李昭玲", "李超钢", "杨晓超", "吴正宪", "吴世雄", "吴碧霞", "怀进鹏", "张大勇", "张和平", "陈立国", "陈吉宁", "陈雨露", "欧阳泽华", "欧阳淞", "周其凤", "周毅"];
        var name = _.sample(nameList);

        var mongo = require('../clients/mongo.js');
        mongo.collection(role).update({"openId": openId}, {
            "openId": openId,
            "name":name,
            "openInfo": {
                "openid": openId,
                "nickname": name,
                "sex": 1,
                "language": "zh_CN",
                "city": "海淀",
                "province": "北京",
                "country": "中国",
                "headimgurl": "http://wx.qlogo.cn/mmopen/ccvPic0PMFqLM9ibzZWJLsTwuzTMc1nGbjwpZmOgOaPdfQAIRduhWXndtgwDZRuZusCTTPnToqVibibZmZWfzQoy6hcibgicDJbKVl/0",
                "privilege": [],
                "unionid": "op3Elt65DCYlvfpwiBk8zJJuwSXk"
            },
            "createdAt": new Date(),
            "updatedAt": new Date()
        }, {upsert:true});

        res.send({rtn:0, data:{openId:openId, role:role}});
    }
};

var onlineCases = function(req, res, next){

    var caseIds = req.body.caseIds.split(',');
    if(!caseIds.length) return next({rtn:config.errorCode.paramError, message:'empty case id list'});

    caseModel.batchOnline(caseIds, function(err){
        if(err) return next(err);
        res.send({rtn:0});
    });
};

router.get('/givemeauser', createTestUser('users'));
router.get('/givemealawyer', createTestUser('lawyers'));

router.post('/online/cases', onlineCases);

//the error handler
router.use(function(err, req, res, next){
    if(err){
        console.error(err);
        res.send({rtn:config.errorCode.unknownError, message:err});
    }
});

module.exports = router;