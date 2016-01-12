/**
 * Created by Daniels on 12/24/15.
 */
var assert = require('assert');
var async = require('async');
var request = require('request');
var config = require('../profile/config');
var fs  = require('fs');
var _ = require('lodash');
var color = require('color');


request = request.defaults({jar:true});
var jar = request.jar();
describe('Retrieving recommendation data', function() {
    describe('Hooking the cookie', function(){
        it('Hooking cookie start ...', function(done){
            var give = 'http://localhost:8080/ts/givemealawyer';
            request({url: give,jar: jar}, assertBody(done));
        });
    });

    describe('Retrieving start ...', function(){
        it('GO', function(done){
            //TODO: retrieving recommendation data
            var url = 'http://localhost:8080/va/ly/cases/suggest';
            request({url: url, method: 'GET', jar: jar}, assertBody(done));
        });
    });
});


var assertBody = function (cb) {
    return function (err, resp, body) {

        if (err) return cb(err);
        var result = body;

        if (typeof body == 'string') {
            try {
                result = JSON.parse(body);
            }
            catch (err) {
                return cb(new Error('response format error: ' + body));
            }
        }
        if (result.rtn != 0) {
            return cb(new Error('error api response: rtn:' + result.rtn + ' message:' + result.message));
        }
        console.log('\nResult status', result.rtn);
        console.log('\n');
        console.log('\nData body', result.data);

        if(result.data.length > 0 && result.data[0].hasOwnProperty('rank')){
            result.data.forEach(function(d){
                console.log('SORT ORDER', d.rank);
            });
        }

        return cb(null, result);
    };
};