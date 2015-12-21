/**
 * Created by zhaohailong on 12/11/15.
 */
var assert = require('assert');
var async = require('async');
var request = require('request');
var config = require('../profile/config.js');

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

        it('should create 100 case', function(done){
            var caseInfo = {
                'caseType':getCaseType(),
                'serviceType':getServiceType(),
                'caseDesc':getCaseDesc(),
                'caseTarget':getCaseTarget(),
                'price1':getCasePrice1()
            };

            var option = {
                url:testHost + '/va/user/cases',
                json:true,
                body:caseInfo
            };

            request(option, function(err, resp, body){
                if(err) throw Error(err);
                if(typeof body == 'string'){
                    try{ body = JSON.parse(body); } catch(err){ console.error('error response:', body); }
                }
                done();
            })
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
    return (min + Math.random() * (max-min)).toFixed(2);
};

var getLocationLat = function(){
    var max = 41.03;
    var min = 39.26;
    return (min + Math.random() * (max-min)).toFixed(2);
};