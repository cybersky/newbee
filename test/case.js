/**
 * Created by zhaohailong on 12/11/15.
 */
var assert = require('assert');
var async = require('async');
var request = require('request');
var config = require('../profile/config.js');
var _ = require('underscore');

request = request.defaults({jar:true});
var testHost = 'http://localhost:8080';



describe('let us get started', function(){

    before(function() {
        console.log('begin the newbee api test...');
    });

    after(function() {
        console.log('all api test finished');
    });

    beforeEach(function() {
        console.log('TEST ONE API');
    });

    afterEach(function() {
        console.log('ONE API FINISHED');
    });

    describe('create case', function(){
        it('should get the openId signed cookie', function(done){
            request(testHost + '/ua/gettestopenid', done);
        });

        it('should create 10 case', function(done){

            async.eachLimit(_.range(10), 5, function(index, cb){
                var caseInfo = {
                    'caseType':getCaseType(),
                    'serviceType':getServiceType(),
                    'caseDesc':getCaseDesc(),
                    'caseTarget':getCaseTarget(),
                    'price1':getCasePrice1(),
                    'lon':getLocationLon(),
                    'lat':getLocationLat()
                };

                var option = {
                    url:testHost + '/va/user/cases',
                    json:true,
                    body:caseInfo,
                    method:'post'
                };

                request(option, function(err, resp, body){
                    if(err) throw Error(err);
                    if(typeof body == 'string'){
                        try{ body = JSON.parse(body); } catch(err){ console.error('error response:', body); }
                    }
                    assert.equal(body.rtn , 0);
                    console.log('case create ok, id:', body.data.id);

                    cb();
                })
            }, done);

        });

        it('should return 10 cases', function(done){

            request(testHost + '/va/user/cases', function(err, resp, body){
                if(typeof body == 'string'){
                    try{ body = JSON.parse(body); } catch(err){ console.error('error response:', body); }
                }
                console.log('body', body);

                assert.equal(err, null);
                assert.equal(body.rtn, 0);
                assert.equal(body.data.length, 10);

                done();
            });

        });

    });

    describe('get my case for user', function(){
        it('should create a case', function(done){
            done();
        });
    });

    describe('get cases for lawyer', function(){
        it('should create a case', function(done){
            done();
        });
    });


});



var getCaseType = function(){
    var index = (Math.random()*100).toFixed() % config.userCaseType.length;
    return config.userCaseType[ index ].name;
};

var getServiceType = function(){
    var index = (Math.random()*100).toFixed() % config.userServiceType.length;
    return config.userServiceType[ index ].name;
};

var getCaseDesc = function(){
    return "As of jQuery 1.5, all of jQuery's Ajax methods return a superset of the XMLHTTPRequest object. This jQuery XHR object, or jqXHR, returned by $.get() implements the Promise interface, giving it all the properties, methods, and behavior of a Promise (see Deferred object for more information). The jqXHR.done() (for success), jqXHR.fail() (for error), and jqXHR.always() (for completion, whether success or error) methods take a function argument that is called when the request terminates. For information about the arguments this function receives, see the jqXHR Object section of the $.ajax() documentation.";
};

var getCaseTarget = function(){
    return "The Promise interface also allows jQuery's Ajax methods, including $.get(), to chain multiple .done(), .fail(), and .always() callbacks on a single request, and even to assign these callbacks after the request may have completed. If the request is already complete, the callback is fired immediately.";
};

var getCasePrice1 = function(){
    return (Math.random() * 10000).toFixed();
};

var getCasePrice2 = function(){
    return (Math.random() * 100).toFixed();
};

var getLocationLon = function(){
    var max = 115.25;
    var min = 117.30;
    return (min + Math.random() * (max-min)).toFixed(4);
};

var getLocationLat = function(){
    var max = 41.03;
    var min = 39.26;
    return (min + Math.random() * (max-min)).toFixed(4);
};