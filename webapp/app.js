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

// deny access to non validated user requests and redirect
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

// deny access to non validated user requests (for popups)
function restricted_popup(req, res, next) {
	// check for valid session
  if (req.session.verified) {
    next();
  } else {
		// need to authenticate...
		authmesg = "<script>$('#popup').dialog('option', 'buttons', { 'ok': function () " 
		+ "{window.location.replace('/login');} })" 
		+ "</script><h1 class='popup'>Session Timeout</h1><hr><p class='alert'>" 
		+ "*** your session has timed out ***</p><hr>";
    res.send(authmesg);
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


//********* Routes *********
// login / out
app.get('/login', routes.login);
app.post('/login', routes.loginto);
app.get('/logout', routes.logout);

// popups
app.get('/popup/newschedule', restricted_popup, routes.pop_schedule_new);
app.get('/popup/viewschedule', restricted_popup, routes.pop_schedule_view);
app.get('/popup/security', restricted_popup, routes.pop_settings_security);
app.get('/popup/general', restricted_popup, routes.pop_settings_general);
app.get('/popup/email', restricted_popup, routes.pop_settings_email);
app.get('/popup/wifi', restricted_popup, routes.pop_settings_wifi);
app.get('/popup/ethernet', restricted_popup, routes.pop_settings_ethernet);
app.get('/popup/accesspoint', restricted_popup, routes.pop_settings_accesspoint);
app.get('/popup/time', restricted_popup, routes.pop_settings_time);
app.get('/popup/editfavorites', restricted_popup, routes.pop_settings_editfavorites);
app.get('/popup/editgroups', restricted_popup, routes.pop_control_editgroups);
app.get('/popup/power', restricted_popup, routes.pop_control_power);
app.get('/popup/run', restricted_popup, routes.pop_control_run);
app.get('/popup/viewremotes', restricted_popup, routes.pop_remotes_view);
app.get('/popup/runremotes', restricted_popup, routes.pop_remotes_run);

// restricted routes
app.get('/', restricted, setup, routes.index);
app.get('/reboot', restricted, routes.reboot);
app.get('/shutdown', restricted, routes.shutdown);

// setup (also restricted)
app.get('/setup', restricted, routes.setup);
app.post('/setup', restricted, routes.setitup);

//********* End Routes *********

// start server
app.listen(port);
setTimeout(function() {
	console.log(' |---[     Listening on port ' + port + '      ]---|');
	console.log(' |~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~|');
	console.log('');
}, 3300);

// init xbee module
setTimeout(function() {
	controller.xbee.init();
},5400);

// controller emitter handlers
controller.on('zoneChange', function() {
	console.log(Date() + ' (io) [zones update broadcast]');
	app.io.broadcast('zones', controller.zones);
});

controller.on('beeChange', function() {
	console.log(Date() + ' (io) [bees update broadcast]');
	app.io.broadcast('bees', controller.bees);
});

// Begin socket.io routes....
// =================================================
// routing similar to express, thanks to express.io

// wifiscan io request
app.io.route('wifiscan', function(req) {
	console.log(Date() + ' (io) [wifiscan request] from ' + req.session.uname);
	controller.wifi.scan(function(json_output){
		console.log('outtie ' + json_output );
		console.log(JSON.stringify(json_output));
		req.io.emit('scanned', json_output);
	});
});

// restart request
app.io.route('reboot', function(req) {
	console.log(Date() + ' (io) [reboot request] from ' + req.session.uname);
	controller.reboot();
});

// shutdown request
app.io.route('shutdown', function(req) {
	console.log(Date() + ' (io) [shutdown request] from ' + req.session.uname);
	controller.shutdown();
});

// multi-request route for io control (and xbees)
app.io.route('control', {
  zone: function(req) {
		controller.controlZone(req.data.zone, req.data.value);
		console.log(Date() + ' (io) [control zone] ' + req.data.zone + ' => ' + req.data.value);
  },
  xbee: function(req) {
		controller.controlBee(req.data.hex_id, req.data.port, req.data.value);
		console.log(Date() + ' (io) [control xbee] ' + req.data.hex_id + ':' + req.data.port + ' => ' + req.data.value);
  }
});

// multi-request route to handle all user modifications
app.io.route('put', {
  security: function(req) {
		controller.db.authenticate(req.session.uname, req.data.oldpassword, req.ip, function(err, umail) {
			if (err == 'pass') {
				req.io.emit('valid_pass');
				controller.db.updateUser(req.data.username, req.data.password);
				if (req.session.verified) {
					req.session.verified = false;
					req.session.message = "*** Logged Out ***"
				}
			}
			else {
				req.io.emit('invalid_pass');
			}
		});
		console.log(Date() + ' (io) [update security] ' + req.session.uname + ' => ' + req.data.username);
  },
  email: function(req) {
		controller.db.updateEmail(req.data.email);
		console.log(Date() + ' (io) [update email] new email for ' + req.session.uname + ': ' + req.data.email);
  },
  general: function(req) {
		controller.db.putSystemSettings(req.data.hostname, req.data.description, req.data.tempdisplay, req.data.apmode);
		controller.updateSystemVariables();
		console.log(Date() + ' (io) [update general] from ' + req.session.uname);
		// broadcast changes
		setTimeout(function() {
			var servdata = {'hostname': controller.getHostname(), 'apmode': controller.getAPmode(), 'tempdisp': controller.getTempdisplay()};
			app.io.broadcast('serverdata', servdata);
			console.log(Date() + ' (io) [update general broadcast]');
		}, 666);
  },
	time: function(req) {
		controller.setTimeDate(req.data.timedate/1000);
		app.io.broadcast('time', req.data.timedate);
		console.log(Date() + ' (io) [time update boradacast] => ' + req.data.timedate);
	}
});

// example of multi-request route.  Client usage ('get:sensors')
app.io.route('get', {
  time: function(req) {
		var now = new Date();
		req.io.emit('time', now.getTime());
		console.log(Date() + ' (io) [time request] from ' + req.session.uname);
  },
  climate: function(req) {
		var climate = {'temp': controller.getTemperature().toFixed(1), 'hum': controller.getHumidity().toFixed(1)};
		req.io.emit('climate', climate);
		console.log(Date() + ' (io) [climate request] from ' + req.session.uname);
  },
  serverdata: function(req) {
		var servdata = {'hostname': controller.getHostname(), 'apmode': controller.getAPmode(), 'tempdisp': controller.getTempdisplay()};
		req.io.emit('serverdata', servdata);
		console.log(Date() + ' (io) [serverdata request] from ' + req.session.uname);
  },
  actuatordata: function(req) {
		controller.db.getActuators('all', function(actuators) {
			req.io.emit('actuators', actuators);
			console.log(Date() + ' (io) [actuatordata request] from ' + req.session.uname);
		});
  },
  zones: function(req) {
		req.io.emit('zones', controller.zones);
		console.log(Date() + ' (io) [zonedata request] from ' + req.session.uname);
  },
  bees: function(req) {
		req.io.emit('bees', controller.bees);
		console.log(Date() + ' (io) [beesdata request] from ' + req.session.uname);
  },
  sensordata: function(req) {
		controller.db.getSensors(function(sensors) {
			req.io.emit('sensors', sensors);
			console.log(Date() + ' (io) [sensordata request] from ' + req.session.uname);
		});
  }
});
