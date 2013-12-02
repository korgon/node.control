//	node.control routes
exports.test = function(req, res) {
	res.render('test', { title: 'Testing.....' });
};

// start popups
exports.pop_schedule_new = function(req, res) {
	res.render('popup/newschedule');
};

exports.pop_schedule_view = function(req, res) {
	res.render('popup/viewschedule');
};

exports.pop_remotes_view = function(req, res) {
	res.render('popup/viewremotes', { hostname: controller.getHostname() });
};

exports.pop_control_power = function(req, res) {
	res.render('popup/power');
};

exports.pop_control_run = function(req, res) {
	res.render('popup/run', { hostname: controller.getHostname() });
};

exports.pop_control_editgroups = function(req, res) {
	res.render('popup/editgroups', { hostname: controller.getHostname() });
};

exports.pop_settings_editfavorites = function(req, res) {
	res.render('popup/editfavorites');
};

exports.pop_settings_security = function(req, res) {
	controller.db.getUserData(function(uname) {
		res.render('popup/security', { username: uname.uname });
	});
};
exports.pop_settings_email = function(req, res) {
	controller.db.getUserData(function(uname) {
		res.render('popup/email', { email: uname.email });
	});
};
exports.pop_settings_general = function(req, res) {
	res.render('popup/general', { hostname: controller.getHostname(), description: controller.getDesc(), apmode: controller.getAPmode(), tempdisplay: controller.getTempdisplay() });
};
exports.pop_settings_wifi = function(req, res) {
	res.render('popup/wifi', { hostname: controller.getHostname() });
};
exports.pop_settings_accesspoint = function(req, res) {
	res.render('popup/accesspoint', { hostname: controller.getHostname() });
};
exports.pop_settings_ethernet = function(req, res) {
	res.render('popup/ethernet', { hostname: controller.getHostname() });
};
exports.pop_settings_time = function(req, res) {
	res.render('popup/time', { hostname: controller.getHostname() });
};
// end popups


exports.index = function(req, res) {
  res.render('index', { title: 'node.control', apmode: controller.getAPmode() });
};

exports.reboot = function(req, res) {
  res.render('reboot', { title: 'node.control: reboot' });
};

exports.shutdown = function(req, res) {
  res.render('shutdown', { title: 'node.control: shutdown' });
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

// edit settings

exports.settings = function(req, res) {
	if (req.params.id == 'wlan0')
  	res.render('settings', { title: 'Controller Settings' });
	else if (req.params.id == 'eth0')
			res.render('settings', { title: 'Controller Settings' });
	else if (req.params.id == 'system')
			res.render('settings', { title: 'Controller Settings' });
	else if (req.params.id == 'security')
			res.render('settings', { title: 'Controller Settings' });
	else if (req.params.id == 'accesspoint')
			res.render('settings', { title: 'Controller Settings' });
	else if (req.params.id == 'internet')
			res.render('settings', { title: 'Controller Settings' });
	else if (req.params.id == '' || req.params.id == null)
			res.render('settings', { title: 'Controller Settings' });
	else
		res.render('404', { title: 'Page not found', error: req.url + ' does not exist...' });
};

exports.editsettings = function(req, res) {
	// pull variables from form post
	//var eth0_data = {mode: req.body.eth0_mode, ip: req.body.eth0_ip, subnet: req.body.eth0_subnet, gw: req.body.eth0_gw, dns1: req.body.eth0_dns1, dns2: req.body.eth0_dns2};
	req.session.message = "Updated something..."
	res.redirect('/settings');
};

// setup controller
exports.setup = function(req, res) {
	if (controller.getSetup() == 0) {
		controller.db.getUserData(function(uname) {
			controller.db.setupPull(function(settings) {
				res.render('setup', { title: 'Initial Setup', username: uname.uname, email: uname.email, wifis: "", hostname: settings.hostname, description: settings.description, eth0: settings.eth0_data, wlan0: settings.wlan0_data });
			});
		});
	}
	else res.redirect('/');
}

exports.setitup = function(req, res) {
	// pull variables from form post
	var eth0_data = {mode: req.body.eth0_mode, ip: req.body.eth0_ip, subnet: req.body.eth0_subnet, gw: req.body.eth0_gw, dns1: req.body.eth0_dns1, dns2: req.body.eth0_dns2};
	var wlan0_data = {ssid: req.body.wlan0_ssid + '', bssid: req.body.wlan0_mac, security_type: req.body.wlan0_security, username: req.body.wlan0_username, password: req.body.wlan0_password + '', mode: req.body.wlan0_mode, ip: req.body.wlan0_ip, subnet: req.body.wlan0_subnet, gw: req.body.wlan0_gw, dns1: req.body.wlan0_dns1, dns2: req.body.wlan0_dns2};
	// update username/pass and the system variables
	controller.db.updateUser(req.body.username, req.body.password);
	controller.db.updateEmail(req.body.email);
	controller.db.setupDone(req.body.hostname, req.body.description, eth0_data, wlan0_data);
	controller.wifi.connect(wlan0_data, function() {
		// successful connection!
		controller.updateSystemVariables();
		res.redirect('/');
	});
};

exports.sensors = function(req, res) {
	// create json object, then push it into jade or to client
	controller.db.getSensors(function(senzors) {
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
	controller.db.authenticate(req.body.username, req.body.password, req.ip, function(err, umail) {
		if (err != 'pass') {
			req.session.message = "*** Invalid Username / Password ***";
			res.redirect('/login');
		}
		else {
			req.session.verified = true;
			req.session.uname = req.body.username;
			req.session.email = umail;
			if (req.session.forward) res.redirect(req.session.forward);
			else res.redirect('/');
		}
	});
};

exports.logout = function(req, res) {
	// destroy session, send to login
	if (req.session.verified) {
		req.session.verified = false;
		req.session.message = "*** Logged Out ***"
	}
	res.redirect('/login');
};
