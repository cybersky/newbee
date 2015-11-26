/**
 * Created by Daniels on 2015/9/26.
 */
exports.applicationPort = 80;
exports.uploadPath = __dirname + '/../public/upload';

exports.mongodb = {host: '10.128.130.213', port: 27017, dbName: 'newbee'};
exports.getMongoUri = () => {
	return 'mongodb://'+exports.mongodb.host+':'+exports.mongodb.port+'/'+ exports.mongodb.dbName;
};

exports.redis = {host: '10.128.130.213', port: 6379};
exports.cookieConfig = {
	name: 'nbToken',
	privateKey: '123_[newBeeToken]-!@#',
	options: {
		path: '/', expires: Date.now() + 1000 * 60 * 60 * 24 * 30,
		maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true
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


exports.optionsLawyer = {
    appid:"wx9255a6db434d4445",
    appsecret:"7b722b1387a11f074152ae5b6bb62019",
    token:"tobeabetterman123",
    encrypt_key:"CNqS9x3rlZIB8DXasI4tPceB0MgiqoZ1QzRXkC2pRdy"
};


exports.optionsUser = {
    appid: "wx64802809beca7462",
    appsecret:"278963cb69ffe134838fede139a3b2be",
    token:"tobeabetterman123",
    encrypt_key:"CNqS9x3rlZIB8DXasI4tPceB0MgiqoZ1QzRXkC2pRdy"
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


exports.skipConfirmCode = true;


exports.sessionCookieMaxAge = 1000 * 60 * 60 * 24 * 30;
//use override.js to override default config values.
(() =>{
	var overrideLocation = __dirname + '/../override.js';
	var fs = require('fs');
	var override = {};

	if (fs.existsSync(overrideLocation)) {
		console.log('Using override configuration', overrideLocation);
		override = require(overrideLocation);
	} else if (fs.existsSync('profile/override.js')) {
		console.log('Using local override configuration.');
		override = require('./override.js');
	}

	for (var key in override) {
		if (key in exports) exports[key] = override[key];
	}
})();