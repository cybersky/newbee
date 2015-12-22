/**
 * Created by Daniels on 10/28/15.
 */

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var plugins	= require('./plugins');


var Operator = new Schema({
    username: {type: String},
    email: {type: String},
    password: {type: String},
    level: {type: Number, default: 9 },
    is_admin:{type: Boolean, default: true},
    createAt: {type: Date},
    updateAt: {type: Date}
});

Operator.plugin(plugins.documentDate);
Operator.plugin(plugins.hiddenFields);
Operator.index({email: 1, unique: true});

exports.Operator = mongoose.model('Operator', Operator);