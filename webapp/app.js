// node.control

var express = require('express');
var routes = require('./routes');
var http = require('http');

// node.control dependencies.
var mods = require('./mods');
var db = new mods.dman();

var app = express();

// session middleware

app.configure(function() {
	app.set('port', process.env.PORT || 3000);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');

	// middleware (order matters!)
	app.use(express.bodyParser());
	app.use(express.cookieParser('seckrets dunt maek friendz'));
	app.use(express.session());
	app.use(express.methodOverride());

  // put any custom middleware here
	app.use(function(req, res, next) {
		// take any session variables and send them to res object
		var msg = req.session.message;
		delete req.session.message;
		res.locals.message = '';
		if (msg) res.locals.message = msg;
		req.db = db;  // attach database object
		next();
	});

	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	
	// catch anything else
	app.use(function(req, res) {
		res.send(404, "Page does not exist...");
	});
});

// if not setup force redirect to setup
function setup(req, res, next) {
	// check for initial setup
	db.setupCheck(function(chk) {
		if (chk == 0) {
			res.redirect('/setup');
		} else next();
	});
}

// deny access to non validated user requests
function restricted(req, res, next) {
	// check for valid session
  if (req.session.verified) {
    next();
  } else {
		// need to authenticate...
		req.session.forward = req.url;
    res.redirect('/login');
  }
}

// routes
app.get('/test', routes.test);

app.get('/setup', routes.setup);
app.post('/setup', routes.setitup);
// login / out
app.get('/login', setup, routes.login);
app.post('/login', setup, routes.loginto);
app.get('/logout', setup, routes.logout);

// restricted routes
app.get('/', restricted, routes.index);
app.get('/schedule', restricted, routes.schedule);
app.get('/control', restricted, routes.control);
app.get('/nodes', restricted, routes.nodes);
app.get('/settings', restricted, routes.settings);
app.get('/sensors', restricted, routes.sensors);
// end routes

// start server
http.createServer(app).listen(app.get('port'), function(){
  console.log('Node.control server listening on port ' + app.get('port'));
});
