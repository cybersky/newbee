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
var rp = require('request-promise');

request = request.defaults({jar: true});
var testHost = 'http://localhost:8080';

var userCount = 5;
var lawyerCount = 5;
var caseCount = 10;

var userJar = [];
var lyJar = [];
var caseIds = [];


describe('let us start', function () {

    before(function () {
        //console.log('before let us start');
    });

    after(function () {
        //console.log('after let us start');
    });

    beforeEach(function () {
        //console.log('before each let us start');
    });

    afterEach(function () {
        //console.log('after each let us start');
    });


    describe('let us create some cases for ' + userCount + ' users, each with ' + caseCount + ' cases', function () {

        before(function (done) {
            done();
        });

        after(function (done) {
            done();
        });

        beforeEach(function (done) {
            done();
        });

        afterEach(function (done) {
            done();
        });


        it('should create ' + userCount + ' users', function (done) {
            async.each(_.range(userCount), function (item, cb) {
                var jar = request.jar();
                userJar.push({jar: jar});
                request({url: testHost + '/ts/givemeauser', jar: jar}, assertBody(cb));
            }, done)
        });


        it('should create <' + caseCount + ' case for each user', function (done) {

            async.each(userJar, function (item, cb) {
                //var count = _.random(1, caseCount);
                count = caseCount;
                item.caseCount = count;
                createUserCase({jar: item.jar, count: count, caseIds: caseIds}, cb);
            }, done);

        });


        it('should return the cases for each user', function (done) {

            async.each(userJar, function (item, cb) {
                var count = item.caseCount;

                request({url: testHost + '/va/user/cases', jar: item.jar}, assertBody(function (err, body) {
                    assert.equal(body.data.length, count);
                    item.cases = body.data;
                    cb();
                }));

            }, done);

        });

        it('should update a random case for each user', function (done) {

            async.each(userJar, function (item, cb) {
                var rand = _.random(0, item.cases.length - 1);
                var userCase = item.cases[rand];
                var caseUpdate = {price1: userCase.price1 + 100};//plus 100RMB
                request({
                    url: testHost + '/va/user/cases/' + userCase._id,
                    jar: item.jar,
                    method: 'post',
                    json: true,
                    body: caseUpdate
                }, assertBody(cb));
            }, done);

        });

        it('should comment a case for each user', function (done) {

            async.each(userJar, function (item, cb) {
                var rand = _.random(0, item.cases.length - 1);
                var userCase = item.cases[rand];
                var caseUpdate = {comment: getCaseComment()};//plus 100RMB
                request({
                    url: testHost + '/va/user/cases/' + userCase._id + '/comments',
                    jar: item.jar,
                    method: 'post',
                    json: true,
                    body: caseUpdate
                }, assertBody(cb));
            }, done);

        });

    });


    describe('let operators make the cases online', function () {
        it('should change all cases to online status', function (done) {
            var body = {caseIds: caseIds.join(',')};
            request({url: testHost + '/ts/online/cases', method: 'post', json: true, body: body}, assertBody(done));
        });
    });


    describe('let us search&bid cases for lawyers', function () {

        it('should give me ' + lawyerCount + ' lawyers', function (done) {
            async.each(_.range(lawyerCount), function (item, cb) {
                var jar = request.jar();
                request({url: testHost + '/ts/givemealawyer', jar: jar}, assertBody(function (err, body) {
                    if (err) throw new Error(err);
                    lyJar.push({jar: jar, openId: body.data.openId, info: body.data});
                    cb();
                }));
            }, done)
        });

        it('should return some cases for each lawyer', function (done) {

            async.forEachOf(lyJar, function (ly, key, cb) {
                var query = {sort: ['updated', 'geo', 'price'], page: 0};
                var qs = {
                    sort: query.sort[key % query.sort.length],
                    page: 0,
                    caseType: getCaseType(),
                    serviceType: getServiceType()
                };

                if (qs.sort == 'geo') {
                    qs.lon = getLocationLon();
                    qs.lat = getLocationLat();
                }

                request({url: testHost + '/va/ly/cases', jar: ly.jar, qs: qs}, assertBody(function (err, body) {
                    if (err) return assert.ifError(err);
                    console.log(ly.info.name, 'get', body.data.length + ' cases sort by ' + qs.sort, 'caseType', qs.caseType, 'serviceType', qs.serviceType);

                    _.each(body.data, function (item) {
                        var distance = qs.lon && qs.lat ? geolib.getDistance(
                            {latitude: qs.lat, longitude: qs.lon},
                            {latitude: item.lat, longitude: item.lon}
                        ) : 0;

                        //console.log(item._id, 'price1', item.price1, 'updated', item.updatedAt, 'distance', distance, 'caseType', item.caseType, 'serviceType', item.serviceType);
                    });

                    ly.cases = body.data;

                    cb();
                }));
            }, done)

        });

        it('should bid some cases for each lawyer', function (done) {

            var caseUnion = [];
            var totalCount = 0;

            async.each(lyJar, function (ly, cb) {

                totalCount += ly.cases.length;
                caseUnion = _.union(caseUnion, _.map(ly.cases, c => c._id));

                if (caseUnion.length < totalCount) {
                    console.warn('duplicated case found, total:', totalCount, 'union', caseUnion.length);
                }

                console.log('lawyer', ly.info.name, 'has cases', ly.cases.length);
                console.log('case union count:', caseUnion.length, 'cases', caseUnion);

                async.each(ly.cases, function (item, cb1) {
                    var caseId = item._id;

                    async.waterfall([
                        function (cb) {
                            request({url: testHost + '/va/ly/cases/' + caseId, jar: ly.jar}, assertBody(cb));
                        },
                        function (body, cb) {
                            var bids = body.data.bids;

                            var biderList = _.pluck(bids, 'lawyerOpenId');

                            if (biderList.indexOf(ly.openId) >= 0) {
                                console.log('lawyer', ly.info.name, 'already bid', caseId, 'SKIP');
                                return cb1();
                            }

                            console.log('lawyer', ly.openId, 'bid case', caseId);
                            var newPrice = item.price1 + _.random(-100, 100);

                            var option = {
                                url: testHost + '/va/ly/' + caseId + '/bids',
                                method: 'post',
                                jar: ly.jar,
                                json: true,
                                body: {
                                    price1: newPrice,
                                    comment: 'lawyer ' + ly.info.name + ' bid at price ' + newPrice
                                }
                            };
                            request(option, assertBody(cb));
                        },
                        function (body, cb) {
                            //fetch again to confirm bid succeed.
                            request({url: testHost + '/va/ly/cases/' + caseId, jar: ly.jar}, assertBody(cb));
                        },
                        function (body, cb) {
                            var bids = body.data.bids;

                            if (bids && bids.length > 0) {
                                var bidList = _.pluck(bids, 'lawyerOpenId');
                                if (bidList.indexOf(ly.openId) < 0) {
                                    throw new Error('bid not succeed');
                                }

                                ly.local = ly.local || {};
                                ly.local.bidCases = ly.local.bidCases || [];
                                ly.local.bidCases.push(caseId);

                                console.log('lawyer', ly.info.name, 'bid case', caseId, 'ok, bids count', bidList.length);

                                return cb();
                            }
                        }

                    ], cb1);

                }, cb);

            }, done);

        });


        it('should get lawyers bid cases', function (done) {
            async.each(lyJar, function (ly, cb) {

                async.waterfall([
                    function (cb) {
                        request({url: testHost + '/va/ly/bids', jar: ly.jar}, assertBody(cb));
                    },
                    function (list, cb) {
                        var caseIds1 = _.map(list.data, c => c.caseId);
                        var caseIds2 = ly.local.bidCases;

                        assert.equal(_.difference(caseIds1, caseIds2).length, 0);
                        ly.bids = list.data;
                        cb();
                    }
                ], cb);

            }, done);

        });


        it('should change lawyer bid price&comment', function (done) {

            async.each(lyJar, function (ly, cb) {

                async.each(ly.bids, function (bid, cb) {

                    var newbid = {price1: bid.price1 + _.random(1, 100), comment: bid.comment + 'append by update'};

                    request({
                        url: testHost + '/va/ly/bids/' + bid._id,
                        body: newbid,
                        json: true,
                        method: 'post',
                        jar: ly.jar
                    }, assertBody(cb));

                }, cb);

            }, done);

        });


        it('should delete the first one lawyer bid', function(done){
            var ly = lyJar[0];

            async.each(ly.bids, function (bid, cb) {

                request({
                    url: testHost + '/va/ly/bids/' + bid._id,
                    method: 'delete',
                    jar: ly.jar
                }, assertBody(cb));

            }, done);
        });

    });

    describe('let users target their lawyers', function () {

        it('should get the cases for users', function (done) {
            async.each(userJar, function(user, cb){
                request({url:testHost+'/va/user/cases', jar:user.jar}, assertBody(function(err, result){
                    user.cases = result.data;
                    cb();
                }));
            }, done);
        });


        it('should choose target lawyer for bids', function(done){
            async.each(userJar, function(user, cb){

                async.each(ly.cases, function(c, cb){
                    if(c.bids.length == 0){
                        console.log('case', c._id, 'no bids, skip');
                        return cb();
                    }

                    var targetBid = c.bids[ _.random(0, c.bids.length-1) ];



                });

                request({url:testHost+'/va/user/cases', jar:user.jar}, assertBody(function(err, result){
                    user.cases = result.data;
                    cb();
                }));
            }, done);
        });
    });


    describe('lawyers should accept the target and start process case', function () {
        it('should', function (done) {
            done();
        });
    });


});


var getCaseType = function () {
    var index = (Math.random() * 100).toFixed() % config.userCaseType.length;
    return config.userCaseType[index].name;
};

var getServiceType = function () {
    var index = (Math.random() * 100).toFixed() % config.userServiceType.length;
    return config.userServiceType[index].name;
};

var getCaseDesc = function () {
    return "这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述，这是我悬赏案件的描述。";
};

var getCaseTarget = function () {
    return "这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求，这是我悬赏案件的诉求。";
};

var getCasePrice1 = function () {
    return (Math.random() * 10000).toFixed();
};

var getCasePrice2 = function () {
    return (Math.random() * 100).toFixed();
};

var getLocationLon = function () {
    var max = 115.25;
    var min = 117.30;
    return (min + Math.random() * (max - min)).toFixed(4);
};

var getLocationLat = function () {
    var max = 41.03;
    var min = 39.26;
    return (min + Math.random() * (max - min)).toFixed(4);
};

var getCaseComment = function () {
    return 'this is a comment from' + moment().format('YYYY-MM-DD hh:mm:ss') + 'random:' + _.random(1, 100);
};


var assertBody = function (cb) {
    return function (err, resp, body) {

        if (err) return cb(err);
        var result = body;

        if (typeof body == 'string') {
            try {
                result = JSON.parse(body);
            }
            catch (err) {
                cb(new Error('response format error: ' + body));
            }
        }
        if (result.rtn != 0) {
            cb(new Error('error api response: rtn:' + result.rtn + ' message:' + result.message));
        }
        return cb(null, result);
    };
};


var createUserCase = function (option, callback) {

    var cookieJar = option.jar;
    var count = option.count;
    var caseIds = option.caseIds;

    async.eachLimit(_.range(count), 10, function (index, cb) {
        var caseInfo = {
            'caseType': getCaseType(),
            'serviceType': getServiceType(),
            'caseDesc': getCaseDesc(),
            'caseTarget': getCaseTarget(),
            'price1': getCasePrice1(),
            'lon': getLocationLon(),
            'lat': getLocationLat()
        };

        var option = {
            url: testHost + '/va/user/cases',
            json: true,
            body: caseInfo,
            method: 'post',
            jar: cookieJar
        };

        request(option, assertBody(function (err, result) {
            caseIds.push(result.data.id);
            setTimeout(cb, _.random(500, 1500));
        }));

    }, callback);
};