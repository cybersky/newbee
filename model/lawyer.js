/**
 * Created by Daniels on 2015/10/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plugins	= require('./plugins');

//TODO: #1 Let's use singular mode model name #2 change UserSchame -> LawyerSchema, and add one more UserSchame...



var lawyerSchema = exports.LawyerSchema = new Schema({
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

lawyerSchema.plugin(plugins.hiddenFields);
lawyerSchema.plugin(plugins.documentDate);

lawyerSchema.index({lawyerId: 1},{unique: true});
lawyerSchema.index({email: 1}, {unique: true});
lawyerSchema.index({phoneNumber: 1}, {unique: true});
lawyerSchema.index({identityNumber: 1}, {unique: true});


exports.Lawyer = mongoose.model('Lawyer', lawyerSchema);