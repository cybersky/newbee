/**
 * Created by Daniels on 2015/10/17.
 */

var mongoose = require('mongoose');

exports.hiddenFields = function (schema) {
	var toJSON = schema.methods.toJSON || mongoose.Document.prototype.toJSON;
	schema.methods.toJSON = function () {
		var json = toJSON.apply(this, arguments);
		delete json.__v;
		return json;
	};
};