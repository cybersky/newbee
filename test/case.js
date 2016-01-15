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

var userCount = 10;
var lawyerCount = 10;
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
                var user = {jar: request.jar()};
                userJar.push(user);
                request({url: testHost + '/ts/givemeauser', jar: user.jar}, assertBody(function (err, body) {
                    user.info = body.data;
                    user.local = {};
                    cb();
                }));
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
                    lyJar.push({jar: jar, openId: body.data.openId, info: body.data, local: {}});
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

                console.log('lawyer', ly.info.name, 'has',ly.cases.length,'cases');
                console.log('case union count:', caseUnion.length, 'cases');

                async.each(ly.cases, function (userCase, cb1) {
                    var caseId = userCase._id;

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

                            console.log('lawyer', ly.info.name, 'begin bid case', caseId);
                            var newPrice = userCase.price1 + _.random(-100, 100);

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

                                ly.local.bidCases = ly.local.bidCases || [];
                                ly.local.bidCases.push(caseId);

                                var user = _.find(userJar, u => u.info.openId == userCase.userOpenId);

                                if (user) {
                                    console.log('user', user.info.name, '\s case', userCase._id, 'bidded by', ly.info.name);
                                    user.local.bidCases = user.local.bidCases || new Set();
                                    user.local.bidCases.add(caseId);
                                }

                                console.log('lawyer', ly.info.name, 'bid case', caseId, 'ok, bids count', bidList.length);

                                return cb();
                            }
                        }

                    ], cb1);

                }, cb);

            }, done);

        });

        it('should get the bid cases for user', function (done) {

            async.each(userJar, function (user, cb) {
                if (!user.local || !user.local.bidCases || user.local.bidCases.length == 0) {
                    console.log('user', user.info.name, 'have no bid cases, skip');
                    return cb();
                }

                request({
                    url: testHost + '/va/user/cases?status=bid',
                    jar: user.jar
                }, assertBody(function (err, result) {
                    console.log('user', user.info.name, 'should have bidded case', user.local.bidCases);
                    console.log('user', user.info.name, 'actually have case', _.pluck(result.data, '_id'));
                    assert.equal(result.data.length, user.local.bidCases.size);

                    cb();
                }));

            }, done);

        });


        it('should get lawyers bid cases', function (done) {
            async.each(lyJar, function (ly, cb) {

                async.waterfall([
                    function (cb) {
                        request({url: testHost + '/va/ly/bids?status=wait', jar: ly.jar}, assertBody(cb));
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


        it('should delete the first one lawyer bid', function (done) {
            var ly = lyJar[0];

            console.log('begin to delete', ly.bids.length, 'bids');

            async.each(ly.bids, function (bid, cb) {

                request({
                    url: testHost + '/va/ly/bids/' + bid._id,
                    method: 'delete',
                    jar: ly.jar
                }, assertBody(cb));

            }, done);
        });


        it('should get zero bid cases since all deleted', function (done) {

            var ly = lyJar[0];

            async.waterfall([
                function (cb) {
                    request({url: testHost + '/va/ly/bids?status=wait', jar: ly.jar}, assertBody(cb));
                },
                function (result, cb) {
                    assert.equal(result.data.length, 0);
                    ly.bids = result.data;
                    cb();
                }
            ], done);

        });

    });

    describe('let users target their lawyers', function () {

        it('should refresh the cases for users', function (done) {
            async.each(userJar, function (user, cb) {
                request({url: testHost + '/va/user/cases', jar: user.jar}, assertBody(function (err, result) {
                    user.cases = result.data;
                    cb();
                }));
            }, done);
        });

        it('should remove cases for the first user', function (done) {
            var user = userJar[0];

            async.each(user.cases, function (c, cb) {
                console.log('delete case', c._id);
                request({url: testHost + '/va/user/cases/' + c._id, method: 'delete', jar: user.jar}, assertBody(cb));
            }, done);
        });


        it('should refresh the cases for first user again', function (done) {
            var user = userJar[0];

            request({url: testHost + '/va/user/cases?status=online', jar: user.jar}, assertBody(function (err, result) {
                assert.equal(err, null);
                user.cases = result.data;
                assert.equal(user.cases.length, 0);
                done();
            }));

        });


        it('should let user choose target lawyer for bids', function (done) {
            async.each(userJar, function (user, cb) {

                console.log('user', user.info.name, 'have', user.cases.length, 'cases');

                async.each(user.cases, function (c, cb) {
                    if (c.bids.length == 0) {
                        console.log('case', c._id, 'no bids, skip');
                        return cb();
                    }

                    var targetBid = c.bids[_.random(0, c.bids.length - 1)];
                    request({
                        url: testHost + '/va/user/cases/' + targetBid.caseId + '/status',
                        method: 'post',
                        body: {status: 'target', bidId: targetBid._id},
                        json: true,
                        jar: user.jar
                    }, assertBody(function (err, result) {
                        console.log('lawyer', targetBid.lawyerInfo.name, 'win bid case', targetBid.caseId);

                        var ly = _.find(lyJar, ly => ly.info.openId == targetBid.lawyerOpenId);
                        ly.local.bidWins = ly.local.bidWins || [];
                        ly.local.bidWins.push(targetBid);

                        user.local.targetCases = user.local.targetCases || [];
                        user.local.targetCases.push(c._id);
                        cb();
                    }));

                }, cb);

            }, done);
        });


        it('should get the win bids for lawyer', function (done) {

            async.each(lyJar, function (ly, cb) {

                if (!ly.local.bidWins || ly.local.bidWins.length == 0) {
                    console.log('lawyer', ly.info.name, 'have no win bids, skip');
                    return cb();
                }

                request({url: testHost + '/va/ly/bids?status=win', jar: ly.jar}, assertBody(function (err, body) {
                    var bids = body.data;
                    var bidIds = _.pluck(bids, '_id');
                    var localBidIds = _.pluck(ly.local.bidWins, '_id');

                    console.log('lawyer', ly.info.name, 'win', bids.length, 'bids');
                    assert.equal(localBidIds.length, bidIds.length);

                    ly.winBidCases = bids;

                    cb();
                }));

            }, done);
        });

        it('should get the targeted cases for user', function (done) {

            async.each(userJar, function (user, cb) {

                if (!user.local.targetCases || user.local.targetCases.length == 0) {
                    console.log('user', user.info.name, 'have no target cases, skip');
                    return cb();
                }

                request({
                    url: testHost + '/va/user/cases?status=target',
                    jar: user.jar
                }, assertBody(function (err, result) {

                    console.log('user', user.info.name, 'should have target cases', user.local.targetCases);
                    console.log('user', user.info.name, 'actually have target cases', _.pluck(result.data, '_id'));
                    assert.equal(user.local.targetCases.length, result.data.length);
                    cb();
                }));

            }, done);
        });


    });


    describe('lawyers should accept the target and start process case', function () {

        it('should change the bid-win cases into process status for lawyer', function (done) {

            async.each(lyJar, function (ly, cb) {
                if (!ly.winBidCases || ly.winBidCases.length == 0) {
                    console.log('lawyer', ly.info.name, 'have no win bids, skip');
                    return cb();
                }

                async.each(ly.winBidCases, function (bid, cb) {

                    request({
                        url: testHost + '/va/ly/cases/' + bid.caseId + '/status',
                        method: 'post',
                        json: true,
                        body: {status: 'process'},
                        jar:ly.jar
                    }, assertBody(function (err, result) {
                        ly.local.processBids = ly.local.processBids || [];
                        ly.local.processBids.push(bid);

                        var user = _.find(userJar, u => u.info.openId == bid.case.userOpenId);
                        user.local.processCases = user.local.processCases || [];
                        user.local.processCases.push(bid.case);

                        console.log('lawyer', ly.info.name, 'start process user', user.info.name,'on case', bid.caseId);
                        cb();
                    }));

                }, cb);

            }, done);

        });


        it('should get user\'s process cases', function (done) {

            async.each(userJar, function (user, cb) {

                if (!user.local || !user.local.processCases || user.local.processCases.length == 0) {
                    console.log('user', user.info.name, 'have no process cases, skip');
                    return cb();
                }

                request({
                    url: testHost + '/va/user/cases?status=process',
                    jar: user.jar
                }, assertBody(function (err, result) {

                    assert.equal(user.local.processCases.length, result.data.length);
                    console.log('user', user.info.name, 'have', result.data.length, 'processed cases');
                    user.processCases = result.data;

                    cb();
                }));

            }, done);

        });


        it('should close the cases after lawyer process', function(done){

            async.each(userJar, function (user, cb) {

                if (!user.local || !user.local.processCases || user.local.processCases.length == 0) {
                    console.log('user', user.info.name, 'have no process cases, skip');
                    return cb();
                }

                async.each(user.local.processCases, function(c, cb){

                    var status = ['closeu', 'disputeu'][_.random(0, 1)];
                    var body = {status:status};
                    if(status == 'closeu') body.commentOnClose = 'this is the close comment, comment the lawyer service';
                    if(status == 'disputeu') body.commentOnDispute = 'this is the dispute comment, dispute the lawyer service';

                    request({
                        url: testHost + '/va/user/cases/' + c._id + '/status',
                        method:'post',
                        json:true,
                        body:body,
                        jar: user.jar
                    }, assertBody(function (err, result) {

                        if(status == 'closeu'){
                            user.local.closeCases = user.local.closeCases || new Set();
                            user.local.closeCases.add(c._id);
                        }else if(status == 'disputeu'){
                            user.local.disputeCases = user.local.disputeCases || new Set();
                            user.local.disputeCases.add(c._id);
                        }

                        cb();
                    }));

                }, cb);

            }, done);

        });


        it('should confirm the closed cases', function(done) {


            async.each(userJar, function (user, cb) {

                if (!user.local || !user.local.closeCases || user.local.closeCases.length == 0) {
                    console.log('user', user.info.name, 'have no close cases, skip');
                    return cb();
                }

                request({
                    url: testHost + '/va/user/cases?status=closeu',
                    jar: user.jar
                }, assertBody(function (err, result) {
                    assert.equal(user.local.closeCases.length, result.data.length);
                    user.closeCases = result.data;


                }));

            }, done);

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

        if (err) throw new Error(err);
        var result = body;

        if (typeof body == 'string') {
            try {
                result = JSON.parse(body);
            }
            catch (err) {
                throw new Error('response format error: ' + body);
            }
        }
        if (result.rtn != 0) {
            throw new Error('error api response: rtn:' + result.rtn + ' message:' + result.message);
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