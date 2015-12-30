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



describe('let us start', function(){

    before(function() {
        console.log('before let us start');
    });

    after(function() {
        console.log('after let us start');
    });

    beforeEach(function() {
        console.log('before each let us start');
    });

    afterEach(function() {
        console.log('after each let us start');
    });

    var users;

    describe('let us create some cases for five users, each with 5 cases', function(){

        before(function(done){

        });

        after(function(done){

        });

        beforeEach(function(done) {
            console.log('let us create a user');

        });

        afterEach(function() {
            console.log('finish create cases for current user');
        });


        var userJar = [];
        it('should create 5 users', function(done){
            async.each(_.range(5), function(item, cb){
                var jar = request.jar();
                userJar.push({jar:jar});
                request({url:testHost + '/ua/givemeauser', jar:jar}, cb);
            }, done)
        });


        it('should create <10 case for each user', function(done){

            async.each(userJar, function(item, cb){
                var count = _.random(1, 10);
                item.caseCount = count;
                createUserCase({jar:item.jar, count:count}, cb);
            }, done);

        });


        it('should return the cases for each user', function(done){

            async.each(userJar, function(item, cb){
                var count = item.caseCount;

                request({url:testHost + '/va/user/cases', jar:item.jar}, assertBody(function(err, body){
                    assert.equals(body.data.length, count);
                }), cb);

            }, done);

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


var assertBody = function(cb){
    return function(err, resp, body){
        if(err) return cb(err);
        if(typeof body == 'string'){
            try{
                body = JSON.parse(body);
            }
            catch(err)
            {
                return cb('error format:', body);
            }
        }
        if(body.rtn != 0){
            return cb('error api response: rtn:'+body.rtn+ ' message:'+ body.message);
        }
        return cb(null, body);
    };
};


var createUserCase = function(option, callback){

    var cookieJar = option.jar;
    var count = option.count;

    async.eachLimit(_.range(option.count), 10, function(index, cb){
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
            method:'post',
            jar:cookieJar
        };

        request(option, assertBody(cb));

    }, callback);
};