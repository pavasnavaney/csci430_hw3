// server.js

var express  = require('express');
var session  = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var crypto = require('crypto');
var path = require('path');
var url = require('url');
var app      = express();
var port     = process.env.PORT || 8080;

var passport = require('passport');
var flash    = require('connect-flash');

require('./config/passport')(passport); // pass passport for configuration

app.use(morgan('dev')); // console logging every request(can be used for implementing logger later)
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json());

app.set('view engine', 'ejs'); // set up ejs for templating

app.use(session({
	secret: 'OflW3WchR9FdlA==',
	resave: true,
	saveUninitialized: true
 } )); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

app.use(function(req, res, next) {
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
  next();
});
app.all('/uploads/*' , isLoggedIn , function(req , res , next) {
	var path = url.parse(req.url).pathname;
	path = path.split("/");
	var hash = crypto.createHash('sha256').update(JSON.stringify(req.user)).digest('base64');
	hash = hash.replace('/','');
	if(path[2] != hash) {
		res.status(403).send({
       message: 'Access Forbidden'
    });
	}
	next();
});

function isLoggedIn(req, res, next) {
	if (req.isAuthenticated())
		return next();
	res.redirect('/');
}

app.use('/',express.static(path.join(__dirname, 'public')));
require('./app/routes.js')(app, passport);
app.listen(port);
console.log('Server started on port ' + port);
