/**
 * Created by zhaohailong on 12/11/15.
 */
var assert = require('assert');
var async = require('async');
var request = require('request');
var config = require('../profile/config.js');
var _ = require('underscore');
var moment = require('moment');
var geolib = require('geolib');

request = request.defaults({jar:true});
var testHost = 'http://localhost:8080';

var userCount = 10;
var lawyerCount = 5;
var caseCount = 5;

var userJar = [];
var lyJar = [];
var caseIds = [];


describe('let us start', function(){

    before(function() {
        //console.log('before let us start');
    });

    after(function() {
        //console.log('after let us start');
    });

    beforeEach(function() {
        //console.log('before each let us start');
    });

    afterEach(function() {
        //console.log('after each let us start');
    });


    describe('let us create some cases for '+userCount+' users, each with '+caseCount+' cases', function(){

        before(function(done){
            done();
        });

        after(function(done){
            done();
        });

        beforeEach(function(done) {
            done();
        });

        afterEach(function(done) {
            done();
        });




        it('should create '+userCount+' users', function(done){
            async.each(_.range(userCount), function(item, cb){
                var jar = request.jar();
                userJar.push({jar:jar});
                request({url:testHost + '/ts/givemeauser', jar:jar}, assertBody(cb));
            }, done)
        });


        it('should create <'+caseCount+' case for each user', function(done){

            async.each(userJar, function(item, cb){
                var count = _.random(1, caseCount);
                item.caseCount = count;
                createUserCase({jar:item.jar, count:count, caseIds:caseIds}, cb);
            }, done);

        });


        it('should return the cases for each user', function(done){

            async.each(userJar, function(item, cb){
                var count = item.caseCount;

                request({url:testHost + '/va/user/cases', jar:item.jar}, assertBody(function(err, body){
                    assert.equal(body.data.length, count);
                    item.cases = body.data;
                    cb();
                }));

            }, done);

        });

        it('should update a random case for each user', function(done){

            async.each(userJar, function(item, cb){
                var rand = _.random(0, item.cases.length-1);
                var userCase = item.cases[rand];
                var caseUpdate = {price1: userCase.price1 + 100};//plus 100RMB
                request({url:testHost + '/va/user/cases/'+userCase._id, jar:item.jar, method:'post', json:true, body:caseUpdate}, assertBody(cb));
            }, done);

        });

        it('should comment a case for each user', function(done){

            async.each(userJar, function(item, cb){
                var rand = _.random(0, item.cases.length-1);
                var userCase = item.cases[rand];
                var caseUpdate = {comment: getCaseComment()};//plus 100RMB
                request({url:testHost + '/va/user/cases/'+userCase._id+'/comments', jar:item.jar, method:'post', json:true, body:caseUpdate}, assertBody(cb));
            }, done);

        });

    });


    describe('let operators make the cases online', function(){
        it('should change all cases to online status', function(done){
            var body = {caseIds:caseIds.join(',')};
            request({url:testHost + '/ts/online/cases', method:'post', json:true, body:body}, assertBody(done));
        });
    });




    describe('let us search&bid cases for lawyers', function(){

        it('should give me '+lawyerCount+' lawyers', function(done){
            async.each(_.range(lawyerCount), function(item, cb){
                var jar = request.jar();
                lyJar.push({jar:jar});
                request({url:testHost + '/ts/givemealawyer', jar:jar}, assertBody(cb));
            }, done)
        });

        it('should return some cases for each lawyer', function(done){

            async.forEachOf(lyJar, function(item, key, cb){
                var query = {sort:['updated', 'geo', 'price'], page:0};
                var qs = {sort:query.sort[ key % query.sort.length ], page:0};

                if(qs.sort == 'geo'){
                    qs.lon = getLocationLon();
                    qs.lat = getLocationLat();
                }

                request({url:testHost + '/va/ly/cases', jar:item.jar, qs:qs}, assertBody(function(err, body){
                    if(err) return assert.ifError(err);
                    console.log('get', body.data.length+ ' cases sort by '+ qs.sort);
                    _.each(body.data, function(item){

                        var distance = qs.lon && qs.lat ? geolib.getDistance(
                            {latitude: qs.lat, longitude: qs.lon},
                            {latitude: item.lat, longitude: item.lon}
                        ) : 0;

                        console.log(item._id, 'price1', item.price1, 'updated', item.updatedAt, 'distance', distance);
                    });
                    cb();
                }));
            }, done)

        });

        it('should bid a case for each lawyer', function(done){

        });

    });

    describe('let users target their lawyers', function(){
        it('should', function(done){
            done();
        });
    });


    describe('lawyers should accept the target and start process case', function(){
        it('should', function(done){
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

var getCaseComment = function(){
    return 'this is a comment from'+ moment().format('YYYY-MM-DD hh:mm:ss') + 'random:' + _.random(1, 100);
};


var assertBody = function(cb){
    return function(err, resp, body){

        if(err) return cb(err);
        var result = body;

        if(typeof body == 'string'){
            try{
                result = JSON.parse(body);
            }
            catch(err)
            {
                cb(new Error('response format error: '+ body));
            }
        }
        if(result.rtn != 0){
            cb(new Error('error api response: rtn:'+result.rtn+ ' message:'+ result.message) );
        }
        return cb(null, result);
    };
};


var createUserCase = function(option, callback){

    var cookieJar = option.jar;
    var count = option.count;
    var caseIds = option.caseIds;

    async.eachLimit(_.range(count), 10, function(index, cb){
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

        request(option, assertBody(function(err, result){
            caseIds.push(result.data.id);
            setTimeout(cb, _.random(200, 1000));
        }));

    }, callback);
};