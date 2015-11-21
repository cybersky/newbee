/**
 * Created by hailongzhao on 10/31/15.
 */


/**
 * Created by Daniels on 2015/10/17.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plugins	= require('./plugins');



var userSchema = exports.UserSchema = new Schema({
    username: { type: String },
    password: { type: String },
    email: { type: String },
    phoneNumber: {type: String }
});

userSchema.plugin(plugins.hiddenFields);
userSchema.plugin(plugins.documentDate);

userSchema.index({email: 1}, {unique: true});
userSchema.index({phoneNumber: 1}, {unique: true});


exports.User = mongoose.model('User', userSchema);