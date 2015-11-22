/**
 * Created by Daniels on 2015/10/18.
 */

var crypto = require('crypto');

exports.md5 = function(str, encode, digestEncode){
	if(!str) return '';
	if(!encode) encode= 'utf-8';
	if(!digestEncode) digestEncode = 'hex';
	var md5 = crypto.createHash('md5');
	return md5.update(str, encode).digest(digestEncode);
};

exports.sha1 = function(str, encode, digestEncode){
	if(!str) return '';
	if(!encode) encode= 'utf-8';
	if(!digestEncode) digestEncode = 'hex';
	var sha1 = crypto.createHash('sha1');
	return sha1.update(str, encode).digest(digestEncode);
};