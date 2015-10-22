/**
 * Created by Daniels on 2015/9/26.
 */


exports.applicationPort = 8080;

exports.uploadPath = __dirname + '/public/upload';

exports.mongodb = {host: '10.128.130.213', port: 27017, dbName: 'devsite'};
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

exports.sessionCookieMaxAge = 1000 * 60 * 60 * 24 * 30;
//use override.js to override default config values.
(() =>{
	var overrideLocation = __dirname + '/override.js';
	var fs = require('fs');
	var override = {};

	if (fs.existsSync(overrideLocation)) {
		console.log('Using override configuration', overrideLocation);
		override = require(overrideLocation);
	} else if (fs.existsSync('profile/override.js')) {
		console.log('Using local override configuration.');
		override = require('./override');
	}

	for (var key in override) {
		if (key in exports) exports[key] = override[key];
	}

})();