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

exports.documentDate = function(schema, options){
	schema.pre('save', function (next) {
		if (!this._doc.createdAt) this._doc.createdAt = this._doc.updatedAt = new Date;
		next();
	});

	schema.pre('update', function (next) {
		this._doc.updatedAt = new Date();
		next();
	});

	schema.pre('findOneAndUpdate', function (next) {
		this._doc.updatedAt = new Date();
		this._doc.updatedAt = new Date();
		next();
	});
};