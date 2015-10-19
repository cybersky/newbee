/**
 * Created by Daniels on 2015/9/26.
 */


exports.applicationPort = 8080;

exports.mongodb = {host: '192.168.10.106', port: 27017, dbName: 'devsite'};
exports.getMongoUri = function(){
	return 'mongodb://'+exports.mongodb.host+':'+exports.mongodb.port+'/'+ exports.mongodb.dbName;
};

//use override.js to override default config values.
(function () {
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