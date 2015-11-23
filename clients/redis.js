/**
 * Created by Daniels on 10/22/15.
 */
var redis = require('redis');
var config = require('../profile/config');

var client = redis.createClient(config.redis);

client.on('ready', () => {
    console.log('The Redis connection is established with host', config.redis.host, 'and port', config.redis.port);
});
client.on('connect', () => {console.log('Redis steam is connected');});
client.on('error', (err) => {
    console.log('Connecting to redis error', err);
    process.exit(1);
});

exports.client = client;