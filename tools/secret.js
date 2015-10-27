/**
 * Created by Daniels on 2015/10/18.
 */

var crypto = require('crypto');

exports.md5 = function(str, encode){
	if(!str) return '';
	if(!encode) encode= 'utf-8';
	var md5 = crypto.createHash('md5');
	return md5.update(str, encode).digest('hex');
};

exports.sha1 = function(str, encode){
	if(!str) return '';
	if(!encode) encode= 'utf-8';
	var sha1 = crypto.createHash('sha1');
	return sha1.update(str).digest('hex');
};