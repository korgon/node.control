//	node.control routes
exports.test = function(req, res) {
	res.render('examples', { title: 'examples...' });
};

exports.index = function(req, res) {
  res.render('index', { title: 'Sprinkler Controller' });
};

exports.control = function(req, res) {
  res.render('control', { title: 'Manual Control' });
};

exports.nodes = function(req, res) {
  res.render('nodes', { title: 'Manage Nodes' });
};

exports.schedule = function(req, res) {
  res.render('schedule', { title: 'Scheduling' });
};

exports.settings = function(req, res) {
  res.render('settings', { title: 'Controller Settings' });
};

// setup controller
exports.setup = function(req, res) {
	req.db.setupCheck(function(chk) {
		var wifis = [ {ssid: "UCCS Wireless", security: "WPA2", signal: 120}, {ssid: "Pretty fly for a wifi", security: "WEP", signal: 170}, {ssid: "Jesus Loves Internets", security: "none", signal: 220} ];
		if (chk == 0) {
			req.db.getUserData(function(uname) {
				req.db.setupPull(function(settings) {
					res.render('setup', { title: 'Initial Setup', username: uname.uname, email: uname.email, wifis: wifis, hostname: settings.hostname, description: settings.description, eth0: settings.eth0_data, wlan0: settings.wlan0_data });
				});
			});
		}
		else res.redirect('/');
	});
}

exports.setitup = function(req, res) {
	// pull variables from form post
	var eth0_data = {mode: req.body.eth0_mode, ip: req.body.eth0_ip, subnet: req.body.eth0_subnet, gw: req.body.eth0_gw, dns1: req.body.eth0_dns1, dns2: req.body.eth0_dns2};
	var wlan0_data = {ssid: req.body.wlan0_ssid + '', password: req.body.wlan0_password + '', mode: req.body.wlan0_mode, ip: req.body.wlan0_ip, subnet: req.body.wlan0_subnet, gw: req.body.wlan0_gw, dns1: req.body.wlan0_dns1, dns2: req.body.wlan0_dns2};
	// update username/pass and the system variables
	req.db.updateUser(req.body.username, req.body.password, req.body.email);
	req.db.setupDone(req.body.hostname, req.body.description, eth0_data, wlan0_data);
	res.redirect('/');
};

exports.sensors = function(req, res) {
	// create json object, then push it into jade or to client
	req.db.getSensors(function(senzors) {
		res.format({
			html: function() { res.render('sensors', { title: 'Sensors Data', senzors: senzors }); },
			json: function() { res.json(senzors); }
		});
	});
}

exports.login = function(req, res) {
	res.render('login', { title: 'Login...' });
};

exports.loginto = function(req, res) {
	req.db.authenticate(req.body.username, req.body.password, req.ip, function(err, umail) {
		if (err != 'pass') {
			req.session.message = "*** Invalid Username / Password ***";
			res.redirect('/login');
		}
		else {
			req.session.verified = true;
			req.session.email = umail;
			if (req.session.forward) res.redirect(req.session.forward);
			else res.redirect('/');
		}
	});
};

exports.logout = function(req, res) {
	// destry session, send to login
	if (req.session.verified) {
		req.session.verified = false;
		req.session.message = "*** Logged Out ***"
	}
	res.redirect('/login');
};




