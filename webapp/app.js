// node.control express / socket.io

console.log('{| ((( +++ Launching  node.control +++ ))) |}');
console.log(' |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|');

var port = 3000;	// this will be 80 eventually...
express = require('express.io');
app = express().http().io();
var routes = require('./routes');

// node.controller object creation
ctrl = require('./mods');
controller = new ctrl();

// io middleware extension
require('express.io-middleware')(app);

// session middleware
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.locals.pretty = true;  // gives pretty html output from jade

	// middleware (order matters!)
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.session({secret: "sekrets dunt maek freindz..."}));
	app.use(express.methodOverride());

  // put any custom middleware here
	app.use(function(req, res, next) {
		// take any session variables and send them to res object
		var msg = req.session.message;
		delete req.session.message;
		res.locals.message = '';
		if (msg) res.locals.message = msg;
		next();
	});

	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
	
	// catch anything else
	app.use(function(req, res) {
		res.render('404', { title: '* Page not found', error: req.url + ' does not exist...' });
	});
});

// if not setup force redirect to setup
function setup(req, res, next) {
	// check for initial setup
	if (controller.getSetup() == 0) {
		res.redirect('/setup');
	} else next();
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

// deny access to non validated user requests (io)
app.io.use(function (req, next) {
	// check for valid session
  if (req.session.verified) {
    next();
  } else {
		// need to authenticate...
		req.io.emit('error', 'Unauthorized!');
		console.log(Date() + " (io) [unauthorized attempt]");
  }
});

// routes
app.get('/test', routes.test);
app.get('/proto', routes.proto);

// login / out
app.get('/login', routes.login);
app.post('/login', routes.loginto);
app.get('/logout', routes.logout);

// popups
app.get('/popup/security', restricted, routes.pop_settings_security);
app.get('/popup/general', restricted, routes.pop_settings_general);

// restricted routes
app.get('/', restricted, setup, routes.index);
app.get('/schedule', restricted, routes.schedule);
app.get('/control', restricted, routes.control);
app.get('/nodes', restricted, routes.nodes);
// settings
app.post('/settings/edit', restricted, routes.editsettings);
app.get('/settings', restricted, routes.settings);
app.get('/settings/:id', restricted, routes.settings);
// sensors
app.get('/sensors', restricted, routes.sensors);
// setup (also restricted)
app.get('/setup', restricted, routes.setup);
app.post('/setup', restricted, routes.setitup);

// end routes

// start server
app.listen(port);
setTimeout(function() {
	console.log(' |---[     Listening on port ' + port + '      ]---|');
	console.log(' |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|');
	console.log('');
}, 3300);


// Begin socket.io routes....
// =================================================
// routing similar to express, thanks to express.io

// wifiscan io request
app.io.route('wifiscan', function(req) {
	console.log(Date() + ' (io) [wifiscan request] from ' + req.session.uname);
	controller.wifi.scan(function(json_output){
		req.io.emit('scanned', json_output);
	});
});

// multi-request route to handle all user modifications
app.io.route('put', {
  user: function(req) {
		controller.db.updateUser(req.body.username, req.body.password, req.body.email);
		console.log(Date() + ' (io) [updated user] from ' + req.session.uname);
  },
  general: function(req) {
		console.log(Date() + ' (io) [updated general] from ' + req.session.uname);
  }
});

// example of multi-request route.  Client usage ('get:sensors')
app.io.route('get', {
  time: function(req) {
		now = new Date();
		req.io.emit('time', now.getTime());
		console.log(Date() + ' (io) [time request] from ' + req.session.uname);
  },
  sensors: function(req) {
		req.io.emit('sensors', '...senz...');
		console.log(Date() + ' (io) [sensor request] from ' + req.session.uname);
  }
});
