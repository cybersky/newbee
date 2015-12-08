var express = require('express');
var config = require('./profile/config');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression');

var routes = require('./routes/index');

var privateAPI = require('./routes/privateAPI');
var publicAPI = require('./routes/publicAPI');

var adminAPI= require('./routes/adminAPI');
var adminPage = require('./routes/adminPage');

var publicPage = require('./routes/publicPage');
var privatePage = require('./routes/privatePage');

var wxService = require('./routes/wxService');
var wxPage = require('./routes/wxPage');

var session = require('./middleware/session');

var vhost = require('vhost');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('x-powered-by', false);

app.use(function(req, res, next){
    //reject spider
    if(req.get('Referrer').toLowerCase().indexOf('spider') >0){
        res.send('no thanks', 200);
    }
});

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('combined'));
//app.use(favicon());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(config.cookieSecret));


app.use(compression());
app.use(express.static(path.join(__dirname, 'public'), {maxAge: '30d'} ));


app.use(session.storeSessionToRedis());


app.use('/', routes);

app.use('/up', publicPage);
app.use('/ua', publicAPI);

app.use('/vp', privatePage);
app.use('/va', privateAPI);

app.use('/ap', adminPage);
app.use('/aa', adminAPI);

app.use('/ws', wxService);
app.use('/wp', wxPage);

console.log('The Node.js version is', process.version);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});

/*
var appmain = express();
appmain.use(vhost('www.newbee.com'), app);
module.exports = appmain;
*/

module.exports = app;
