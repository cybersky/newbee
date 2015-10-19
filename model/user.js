/**
 * Created by Daniels on 2015/10/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plugins	= require('./plugins');


var UserSchema = exports.UserSchema = new Schema({
	username: { type: String },
	password: { type: String },
	email: { type: String },
	phoneNumber: {type: String },

	identityNumber: {type: String },//personal identity number
	identityFilename: {type: String},//personal identity image name

	lawyerId: {type: String},//lawyer id number
	lawyerIdFilename: { type: String },//lawyer id image name
	lawyerLocation: {type: String},
	lawServiceArea: {type: String },
	authentication: {type: Boolean, default: false }
});

UserSchema.plugin(plugins.hiddenFields);
UserSchema.plugin(plugins.documentDate);

UserSchema.index({lawyerId: 1},{unique: true});
UserSchema.index({email: 1}, {unique: true});
UserSchema.index({phoneNumber: 1}, {unique: true});
UserSchema.index({identityNumber: 1}, {unique: true});;