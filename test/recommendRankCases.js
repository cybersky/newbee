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

var lyJar = [];
var lawyerCount = 5;
var testHost = 'http://localhost:8080';

describe('test recommendation api', function() {

    describe('prepare test lawyers', function(){

        it('should give me ' + lawyerCount + ' lawyers', function (done) {
            async.each(_.range(lawyerCount), function (item, cb) {
                var jar = request.jar();
                request({url: testHost + '/ts/givemealawyer', jar: jar}, assertBody(function (err, body) {
                    if (err) throw new Error(err);
                    lyJar.push({jar: jar, openId: body.data.openId, info: body.data, local: {}});
                    cb();
                }));
            }, done)
        });


        it('should fetch lawyer recommendation cases', function(done){

            async.each(lyJar, function(ly, cb){
                request({url: testHost + '/va/ly/cases/suggest',jar: ly.jar}, assertBody(function(err, result){
                    assert.equal(err,null);
                    console.log('lawyer', ly.info.name, 'get',result.data.length,'recommendation cases');

                    _.each(result.data, d => {
                        console.log('case', d._id, 'rank', d.rank, 'caseType', d.caseType);
                    });
                    cb();
                }));
            }, done);

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

        return cb(null, result);
    };
};