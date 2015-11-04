/**
 * Created by Daniels on 10/22/15.
 */
var session = require('express-session');
var store   = require('connect-redis')(session);
var config  = require('../profile/config');
var redis   = require('../clients/redis');
var uuid 	= require('node-uuid');
var Operator= require('../odm/operator');
var Lawyer	= require('../odm/lawyer');

var redisStore = new store({client: redis.client});

exports.storeSessionToRedis  = () =>  session({
        store: redisStore,
        cookie:{ path: '/', httpOnly: true, secure: false, maxAge: config.sessionCookieMaxAge },
        name: 'sid', saveUninitialized: true, secret: 'newbee', resave: false,
        genid: function(req) {
                return uuid.v4(); // use UUIDs for session IDs
        }
});