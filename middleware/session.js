/**
 * Created by Daniels on 10/22/15.
 */
var session = require('express-session');
var store   = require('connect-redis')(session);
var config  = require('../config');
var redis   = require('../clients/redis');

var redisStore = new store({client: redis.client});

exports.storeSessionToRedis  = () => {
    return session({
        store: redisStore,
        cookie:{ path: '/', httpOnly: true, secure: false, maxAge: config.sessionCookieMaxAge },
        name: 'sid', saveUninitialized: true, secret: 'newbee', resave: false
    });
};