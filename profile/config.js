/**
 * Created by Daniels on 2015/9/26.
 */
exports.applicationPort = 80;
exports.uploadPath = __dirname + '/../public/upload';
exports.switchPhoneVerifyCodeOff = false;
exports.openTestAPI = false;

exports.mongodb = {host: '10.128.130.213', port: 27017, dbName: 'newbee'};
exports.getMongoUri = function(){
	return 'mongodb://'+exports.mongodb.host+':'+exports.mongodb.port+'/'+ exports.mongodb.dbName;
};

exports.redis = {host: '10.128.130.213', port: 6379};
exports.cookieConfig = {
	name: 'nbToken',
	privateKey: '123_[newBeeToken]-!@#',
	options: {
		path: '/', expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
		maxAge: 30 * 24 * 60 * 60 * 1000, signed: true
	}
};
exports.lawyerSignUpToken = {
    name: 'signToken',
    privateKey: '!@#_{signupToken}-=asd21',
    options: {
        path: '/', expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true
    }
};
exports.operatorCookie = {
	name: 'opToken',
	privateKey: '!@#_{operatorToken}-=321',
	options: {
		path: '/', expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
		maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true
	}
};


exports.backDoorOpenId = 'thetestopenid777';

exports.cookieSecret = '98sdfasjljr#$#$@$#dfljd*osiudf';

//云通讯 config http://www.yuntongxun.com/

exports.ytxConfig = {
	//APP ID
	appId : '8a48b551511a2cec01511f22940f111d',
	//APP TOKEN
	appToken : 'b72390ce1c2778d642b28c6ebe545869',
	//ACCOUNT SID：
	accountId : 'aaf98f89511a246a01511f1c852710c0',
	//AUTH TOKEN：
	authToken : '853f58135a6d4a5482e1a81bd7737d12',
	testHost : 'https://sandboxapp.cloopen.com:8883',
	prodHost : 'https://app.cloopen.com:8883',
	path : '/2013-12-26/Accounts/{accountId}/Calls/VoiceVerify?sig={sig}'
};

exports.wxPageHost = 'http://live7.cn';

exports.wxScopeBase = 'snsapi_base';
exports.wxScopeInfo = 'snsapi_userinfo';

exports.wxOauthURL = "https://open.weixin.qq.com/connect/oauth2/authorize?appid={{appId}}&redirect_uri={{redirectUrl}}&response_type=code&scope={{scope}}&state={{state}}#wechat_redirect";
exports.wxTokenURL = "https://api.weixin.qq.com/sns/oauth2/access_token?appid={{appId}}&secret={{appSecret}}&code={{code}}&grant_type=authorization_code";
exports.wxRefreshTokenURL = "https://api.weixin.qq.com/sns/oauth2/refresh_token?appid={{appId}}&grant_type=refresh_token&refresh_token={{refreshToken}}";
exports.wxUserInfoURL = "https://api.weixin.qq.com/sns/userinfo?access_token={{accessToken}}&openid={{openId}}&lang=zh_CN";


exports.wxAccessTokenURL = "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={{APPID}}&secret={{APPSECRET}}";

exports.optionsLawyer = {
    appid:"wx9255a6db434d4445",
    appsecret:"7b722b1387a11f074152ae5b6bb62019",
    token:"tobeabetterman123",
    encrypt_key:"CNqS9x3rlZIB8DXasI4tPceB0MgiqoZ1QzRXkC2pRdy",
    roleCollection:'lawyers'
};


exports.optionsUser = {
    appid: "wx64802809beca7462",
    appsecret:"278963cb69ffe134838fede139a3b2be",
    token:"tobeabetterman123",
    encrypt_key:"CNqS9x3rlZIB8DXasI4tPceB0MgiqoZ1QzRXkC2pRdy",
    roleCollection:'users'
};

exports.optionsTest = {
    appid: "wxc043f1e0885f8645",
    appsecret:"53fe394b2f5f4e57109dd7535dbc423d",
    token:"tobeabetterman123",
    encrypt_key:"CNqS9x3rlZIB8DXasI4tPceB0MgiqoZ1QzRXkC2pRdy",
    roleCollection:'testers'
};

exports.errorCode = {
	unknownError:'100',
	paramError:'101',
	authError:'102',
	serviceError:'103'
};

exports.redisPrefix = {
	verifyCode: 'verifyCode'
};

exports.requireMobileSignIn = true;
exports.skipConfirmCode = false;

exports.operatorLevel = [
    {
        level: 1, label: 'Super User',
        description: '超级用户拥有绝对权限'
    },{
        level: 9, label: 'Operator',
        description: '仅限审核律师注册信息和案件审核'
    }
];

exports.userCaseType = [
    {name:'xsbh', label:'刑事辩护'},
    {name:'lhjf', label:'离婚纠纷'},
    {name:'fwjf', label:'房屋租赁,买卖,拆迁纠纷'},
    {name:'jtsg', label:'交通事故纠纷'},
    {name:'ldgs', label:'劳动工伤纠纷'},
    {name:'htjf', label:'合同纠纷'},
    {name:'zqzw', label:'债权债务纠纷'},
    {name:'gsfw', label:'公司法务纠纷'}
];

exports.userCaseRank = [
    {name: '1', label: '1', value: 1},
    {name: '2', label: '2', value: 1},
    {name: '3', label: '3', value: 1},
    {name: '4', label: '4', value: 1},
    {name: '5', label: '5', value: 1}
];

exports.userServiceType = [
    {name:'xxfw', label:'线下实体服务'},
    {name:'ffzx', label:'付费咨询'},
    {name:'mfzx', label:'免费咨询'}
];


exports.caseStatus = {
    raw:{key:'raw', desc:'案件处于初始状态，需要后台人员整理归类审核才可上线'},
    online:{key:'online', desc:'案件经过了运营人员审核，上线招标'},
    bid:{key:'bid', desc:'已有律师投标'},
    cancel:{key:'cancel', desc:'客户取消案件'},
    target:{key:'target', desc:'客户已经选择了投标律师'},
    process:{key:'process', desc:'案件开始受理案件，进展中'},
    disputeu:{key:'disputeu', desc:'用户发起纠纷状态'},
    disputel:{key:'disputel', desc:'律师发起纠纷状态'},
    closeu:{key:'close', desc:'案件由用户关闭'},
    closel:{key:'close', desc:'案件由律师关闭'},
    reject:{key:'reject', desc:'案件不符合要求，被运营人员拒绝'}
};

exports.caseEvent = {
    change:{key:'change', desc:'案件的描述或者悬赏发生改变'},
    comment:{key:'comment', desc:'案件有人评论'}
};

exports.lawyerStatus = {
    raw: {key: 'raw', desc: '律师注册初始状态'},
    subscribe: {key: 'subscribe', desc: '律师已经绑定了律政新蜂公众号'},
    ok: {key: 'ok', desc: '律师注册审核通过'},
    reject: {key: 'reject', desc: '律师审核未通过'}
};


exports.redisKey = {
    QRSceneGenerator:'qrcode:sceneId:generator',
    QRSceneId:'qrcode:sceneId:'
};

exports.maxQRScene = 100000;


exports.sessionCookieMaxAge = 1000 * 60 * 60 * 24 * 30;
//use override.js to override default config values.

var overrideDefault = '/opt/config/newbee/override.js';

(function(){
    var fs = require('fs');
	var overrideLocation;
	var override = {};

    if ( (overrideLocation = overrideDefault) && fs.existsSync(overrideLocation)) {
        console.log('Using override configuration', overrideLocation);
        override = require(overrideLocation);
    }
	else if ( (overrideLocation = __dirname+'/override.js') && fs.existsSync(overrideLocation)) {
		console.log('Using override configuration', overrideLocation);
		override = require(overrideLocation);
	}

	for (var key in override) {
		if (key in exports) exports[key] = override[key];
	}
})();