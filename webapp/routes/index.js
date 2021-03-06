// Node HTTP Routes
// =================================================


// start popups
exports.pop_schedule_new = function(req, res) {
	res.render('popup/newschedule');
};

exports.pop_schedule_view = function(req, res) {
	res.render('popup/viewschedule');
};

exports.pop_remotes_view = function(req, res) {
	res.render('popup/viewremotes');
};

exports.pop_remotes_run = function(req, res) {
	res.render('popup/runremotes');
};

exports.pop_control_power = function(req, res) {
	res.render('popup/power');
};

exports.pop_control_run = function(req, res) {
	res.render('popup/run');
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
	var wlan0_data = {ssid: req.body.wlan0_ssid + '', bssid: req.body.wlan0_mac, security: req.body.wlan0_security, username: req.body.wlan0_username, password: req.body.wlan0_password + '', mode: req.body.wlan0_mode, ip: req.body.wlan0_ip, subnet: req.body.wlan0_subnet, gw: req.body.wlan0_gw, dns1: req.body.wlan0_dns1, dns2: req.body.wlan0_dns2};
	// update username/pass and the system variables
	controller.db.updateUser(req.body.username, req.body.password);
	controller.db.updateEmail(req.body.email);
	console.log(wlan0_data);
	controller.wifi.connect(wlan0_data, function(err) {
		if (err == 'Error: kill EPERM') {
			res.send('Invalid Key!');
		}
		else if (err)
			res.send('ERROR! ' + err);
		else {
			controller.db.setupDone(req.body.hostname, req.body.description, eth0_data, wlan0_data);
			// successful connection!
			controller.updateSystemVariables();
			setTimeout(function() {
				res.send('Good job guy, settings are valid.  rebooting in 3... 2... 1...');
				setTimeout(function() {
					controller.reboot();
				}, 3000);
			}, 2000);
		}
	});
};

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
