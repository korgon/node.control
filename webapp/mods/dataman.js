// Data management, utilizing dblite
// for node.control returns should be json
// also includes encryption algos
// ---------------------------------------------------
// Listing of exported methods:
//	|--- authenticate(username, password, ip, fn)
// ---------------------------------------------------

// module requirements
var fs = require('fs');
var crypto = require('crypto');
var dblite = require('dblite');

// module variables
var db_path = './mods/database/data.sqlite';
var db;		// private placeholder for database connection

// constructor...
function db_management() {
	if (fs.existsSync(db_path)) {
		console.log(" |---[ Database connection established ]---|");
		db = dblite(db_path);
	}
	else {
		// this should only happen if database does not exist
		init_db();
	}
}

// function for initial installation or db recreation/wipe
// default always creates tables users, system, schedule, remotes, sensors, actuators
// ***** MAKE MORE DYNAMIC LATERS ******
function init_db() {
	db = dblite(db_path);
	console.log(" |---[     Creating new database       ]---|");
	db.query('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, \
		salt TEXT, email TEXT)');
	console.log(" |---------   Table users added   ---------|");
	db.query('CREATE TABLE IF NOT EXISTS system (id INTEGER PRIMARY KEY, hostname TEXT, description TEXT, \
		temp_mode TEXT, setup INTEGER, ap_mode INTEGER, eth0_data TEXT, wlan0_data TEXT)');
	console.log(" |---------   Table system added  ---------|");
	db.query('CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY, description TEXT, \
		start_data TEXT, stop_data TEXT, interupt TEXT)');
	console.log(" |--------- Table schedule added  ---------|");	
	db.query('CREATE TABLE IF NOT EXISTS remotes (hex_id TEXT PRIMARY KEY, type TEXT, description TEXT, alias TEXT)');
	console.log(" |---------  Table remotes added  ---------|");
	db.query('CREATE TABLE IF NOT EXISTS sensors (id INTEGER PRIMARY KEY, name TEXT, alias TEXT, description TEXT, icon TEXT, location TEXT, pin TEXT)');
	console.log(" |---------  Table sensors added  ---------|");
	db.query('CREATE TABLE IF NOT EXISTS actuators (id INTEGER PRIMARY KEY, name TEXT, alias TEXT, description TEXT, icon TEXT, location TEXT, pin TEXT, status INTEGER)');
	console.log(" |--------- Table actuators added ---------|");

	// insert default user admin, first create password ('') and salt
	hash('', function(err, salties, hashies) {
		db.query('INSERT INTO users VALUES (?, ?, ?, ?, ?)', [null, 'admin', hashies, salties, null]);
		console.log(" |---------  Inserted user admin  ---------|");
	});

	// insert default controller module data into system table
	// ***** MAKE MORE DYNAMIC LATERS ******
	db.query('INSERT INTO system VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
		null, 'node', 'sprinkler controller', 'F', 0, 0, 
		{mode: 'dynamic', ip: '0.0.0.0', subnet: '0.0.0.0', gw:'0.0.0.0', dns1:'0.0.0.0', dns2:'0.0.0.0'},
		{ssid: '', bssid: '', security_type: '', username: '', password: '', mode: 'dynamic', ip: '0.0.0.0', subnet: '0.0.0.0', gw:'0.0.0.0', dns1:'0.0.0.0', dns2:'0.0.0.0'}]);
		console.log(" |---------    Defaults loaded    ---------|");

	// remotes should be added as discovered...

	// if sensors/actuators exist add them to the sensor table and create separate table per input
	// adding two sensors for temperature and humidity for testing

	addSensor('temp0', 'temp0', 'onboard temperature sensor', '/images/icons/sensors/temperature.png', 'local', '/dev/i2c-1');
	addSensor('hum0', 'hum0', 'onboard humidity sensor', '/images/icons/sensors/humidity.png', 'local', '/dev/i2c-1');

	// adding zones...
	addActuator('zone1', 'zone1', 'sprinkler solenoid', '/images/icons/actuators/zone1.png', 'local', 'P8_08', 0);
	addActuator('zone2', 'zone2', 'sprinkler solenoid', '/images/icons/actuators/zone2.png', 'local', 'P8_10', 0);
	addActuator('zone3', 'zone3', 'sprinkler solenoid', '/images/icons/actuators/zone3.png', 'local', 'P8_26', 0);
	addActuator('zone4', 'zone4', 'sprinkler solenoid', '/images/icons/actuators/zone4.png', 'local', 'P8_28', 0);
	addActuator('zone5', 'zone5', 'sprinkler solenoid', '/images/icons/actuators/zone5.png', 'local', 'P8_30', 0);
	addActuator('zone6', 'zone6', 'sprinkler solenoid', '/images/icons/actuators/zone6.png', 'local', 'P8_32', 0);
	addActuator('zone7', 'zone7', 'sprinkler solenoid', '/images/icons/actuators/zone7.png', 'local', 'P8_34', 0);
	addActuator('zone8', 'zone8', 'sprinkler solenoid', '/images/icons/actuators/zone8.png', 'local', 'P8_36', 0);
	addActuator('zone9', 'zone9', 'sprinkler solenoid', '/images/icons/actuators/zone9.png', 'local', 'P9_11', 0);
	addActuator('zone10', 'zone10', 'sprinkler solenoid', '/images/icons/actuators/zone10.png', 'local', 'P9_15', 0);
	addActuator('zone11', 'zone11', 'sprinkler solenoid', '/images/icons/actuators/zone11.png', 'local', 'P9_13', 0);
	addActuator('zone12', 'zone12', 'sprinkler solenoid', '/images/icons/actuators/zone12.png', 'local', 'P9_16', 0);
	addActuator('zone13', 'zone13', 'sprinkler solenoid', '/images/icons/actuators/zone13.png', 'local', 'P9_23', 0);
	addActuator('zone14', 'zone14', 'sprinkler solenoid', '/images/icons/actuators/zone14.png', 'local', 'P9_27', 0);
	addActuator('zone15', 'zone15', 'sprinkler solenoid', '/images/icons/actuators/zone15.png', 'local', 'P9_41B', 0);
	addActuator('zone16', 'zone16', 'sprinkler solenoid', '/images/icons/actuators/zone16.png', 'local', 'P9_42B', 0);
}

//********* REMOTE METHODS *********

// add a remote (xbee) sensor/actuator to database
db_management.prototype.addRemote = function(rtype, rhex, rdesc, rinputs, routputs) {
	db.query('INSERT into remotes VALUES (?, ?, ?, ?)', [rhex, rtype, rdesc, '']);
	for (output in routputs) {
		addActuator(output, output, 'output ' + output + ' | ' + rdesc, '/images/icons/actuators/box.png', rhex, routputs[output], 0);
	}
	for (var input in rinputs) {
		//addSensor(rtype + var, 'Input Port ' + var + ' | ' + rdesc, '/images/icons/actuators/box.png', rhex, routputs[var]);
	}
}

// retrieve a remote
db_management.prototype.getRemote = function(hex, fn) {
	var sql = "SELECT * FROM remotes where hex_id='" + hex + "'";
	db.query(sql, {hex_id: String, type: String, desc: String, alias: String}, function(rows) {
		fn(rows[0]);
	});
}

// retrieve list of all remotes
db_management.prototype.getRemotes = function(fn) {
	db.query('SELECT * FROM remotes', {hex_id: String, type: String, desc: String, alias: String}, function(rows) {
		fn(rows);
	});
}

//********* ACTUATOR METHODS *********

// add an output to actuator table for user interface
function addActuator(aname, salias, desc, icon, location, pin, status) {
	db.query('INSERT into actuators VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [null, aname, salias, desc, icon, location, pin, status]);
	console.log(" |---------    Added actuator     ---------|");
}

// retrieve list of actuators (outputs)
db_management.prototype.getActuators = function(location, fn) {
	if (location == 'all') {
		db.query('SELECT * FROM actuators', {id: Number, name: String, alias: String, desc: String, icon: String, loc: String, pin: String, status: Number}, function(rows) {
			fn(rows);
		});
	}
	else {
		db.query('SELECT * FROM actuators where location = "' + location + '"', {id: Number, name: String, alias: String, desc: String, icon: String, loc: String, pin: String, status: Number}, function(rows) {
			fn(rows);
		});
	}
}

//********* SENSOR METHODS *********

// add a sensor to sensor table, and create a table for sensor entries
function addSensor(sname, salias, desc, icon, location, pin) {
	db.query('INSERT into sensors VALUES (?, ?, ?, ?, ?, ?, ?)', [null, sname, salias, desc, icon, location, pin]);
	db.query('CREATE TABLE IF NOT EXISTS ' + sname + ' (time INTEGER PRIMARY KEY, value REAL)');
	console.log(" |---------      Added sensor     ---------|");
}

// retrieve list of all sensors
db_management.prototype.getSensors = function(fn) {
	db.query('SELECT * FROM sensors', {id: Number, name: String, alias: String, desc: String, icon: String, loc: String, pin: String}, function(rows) {
		fn(rows);
	});
}

// log sensor data with timestamp
db_management.prototype.putSensorData = function(sid, rawdata) {
	var now = new Date();
	db.query('INSERT into ' + sid + ' VALUES (?, ?)', [now.getTime(), rawdata]);
}


db_management.prototype.getSensorData = function(sid, fn) {
	db.query('SELECT * FROM ' + sid, {time: Number, value: Number}, function(rows) {
		fn(rows);
	});
}

//********* SETUP METHODS *********

// make changes to the system table from setup form
db_management.prototype.setupDone = function(hostname, desc, eth_d, wlan_d) {
	db.query('UPDATE system set hostname=?, description=?, eth0_data=?, wlan0_data=?, setup=1 where id=1', [hostname, desc, eth_d, wlan_d]);
}

// change hostname, description, temperature display
db_management.prototype.putSystemSettings = function(hostname, desc, tempmode, apmode) {
	db.query('UPDATE system set hostname=?, description=?, temp_mode=?, ap_mode=? where id=1', [hostname, desc, tempmode, apmode]);
}

// retrieve data for setup pages
db_management.prototype.setupPull = function(fn) {
	db.query('SELECT hostname, description, temp_mode, ap_mode, eth0_data, wlan0_data, setup FROM system WHERE id=1', {
		hostname: String, 
		description: String, 
		temp_mode: String,
		ap_mode: Number,
		eth0_data: JSON.parse, 
		wlan0_data: JSON.parse,
		setup: Number
	}, function(rows) {
		fn(rows[0]);
	});
}

//********* USER METHODS *********

// retrieve user login name
db_management.prototype.getUserData = function(fn) {
	db.query('SELECT username, email FROM users WHERE id=1', {uname: String, email: String}, function(rows) {
		var user = rows[0];
		if (user == null) {
			return fn('invalid username');
		}
		return fn(user);
	});
}

// update user login
db_management.prototype.updateUser = function(username, password) {
	// update user, first get salt, then create password hash
	db.query('SELECT salt FROM users WHERE id=1', [username], {salt: String}, function(rows) {
		var user = rows[0];
		if (user.salt == null) {
			return;
		}
		hash(password, user.salt, function(err, hashies) {
			db.query('UPDATE users set username=?, password=? where id=1', [username, hashies]);
		});
	});
}

// update user email
db_management.prototype.updateEmail = function(email) {
	db.query('UPDATE users set email=? where id=1', [email]);
}

// verify user credentials returns 'pass' if verified
db_management.prototype.authenticate = function(username, password, ip, fn) {
	var valid = 0;
	db.query('SELECT * FROM users WHERE username = ?', [username], {id: Number, name: String, pass: String,	salt: String, email: String}, function(rows) {
		var user = rows[0];
		if (user == null) {
			console.log(Date() + ' *** Login Fail: ' + username + " @ " + ip);
			return fn('invalid username');
		}
		hash(password, user.salt, function(err, hashies) {
			if (user.pass == hashies) {
				console.log(Date() + ' *** Login success: ' + user.name + " @ " + ip);					
				fn('pass', user.email);
			} else {
				console.log(Date() + ' *** Login Fail: ' + user.name + " @ " + ip);
				fn('invalid password');
			}
		});
	});
}


// encryption function for generating hash and salt
// function can accept either 2 or 3 arguments (w/salt), (wo/salt)
function hash(pwd, salt, fn) {
	len = 128;
	iterations = 12000;
	if (3 == arguments.length) {
		crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash) {
			fn(err, (new Buffer(hash, 'binary')).toString('base64'));
		});
	} else {
		fn = salt;
		crypto.randomBytes(len, function(err, salt) {
			if (err) return fn(err);
			salt = salt.toString('base64');
			crypto.pbkdf2(pwd, salt, iterations, len, function(err, hash) {
				if (err) return fn(err);
				fn(null, salt, (new Buffer(hash, 'binary')).toString('base64'));
			});
		});
	}
};

module.exports = db_management;
