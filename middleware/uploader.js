/**
 * Created by Daniels on 2015/10/17.
 */
var config = require('../profile/config');
var multer = require('multer');


exports.uploader = function(fields){
    var options = [];
    fields.forEach(function(field){
        options.push({name: field, maxCount: 1});
    });
    return multer({ dest: config.uploadPath }).fields(options);
};