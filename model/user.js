var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plugins	= require('./plugins');


var userSchema = exports.UserSchema = new Schema({
    username: { type: String },
    password: { type: String },
    email: { type: String },
    mobile: {type: String },
    openId: {type:String}
});

userSchema.plugin(plugins.hiddenFields);
userSchema.plugin(plugins.documentDate);

userSchema.index({email: 1}, {unique: true});
userSchema.index({mobile: 1}, {unique: true});
userSchema.index({openId: 1}, {unique: true});


exports.User = mongoose.model('User', userSchema);


