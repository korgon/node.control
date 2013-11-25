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
	console.log(" |--- [Creating new database]");
	db.query('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, \
		salt TEXT, email TEXT)');
	console.log(" |---------   Table users added   ---------|");
	db.query('CREATE TABLE IF NOT EXISTS system (id INTEGER PRIMARY KEY, hostname TEXT, description TEXT, \
		temp_mode TEXT, setup INTEGER, ap_mode INTEGER, eth0_data TEXT, wlan0_data TEXT, xbee_data TEXT)');
	console.log(" |---------   Table system added  ---------|");
	db.query('CREATE TABLE IF NOT EXISTS schedule (id INTEGER PRIMARY KEY, description TEXT, \
		start_data TEXT, stop_data TEXT, interupt TEXT)');
	console.log(" |--------- Table schedule added  ---------|");	
	db.query('CREATE TABLE IF NOT EXISTS remotes (id INTEGER PRIMARY KEY, name TEXT, description TEXT, \
		xbee_data TEXT)');
	console.log(" |---------  Table remotes added  ---------|");
	db.query('CREATE TABLE IF NOT EXISTS sensors (name TEXT PRIMARY KEY, description TEXT, location)');
	console.log(" |---------  Table sensors added  ---------|");
	db.query('CREATE TABLE IF NOT EXISTS actuators (name TEXT PRIMARY KEY, description TEXT, location)');
	console.log(" |--------- Table actuators added ---------|");

	// insert default user admin, first create password ('') and salt
	hash('', function(err, salties, hashies) {
		db.query('INSERT INTO users VALUES (?, ?, ?, ?, ?)', [null, 'admin', hashies, salties, null]);
		console.log(" |---------  Inserted user admin  ---------|");
	});

	// insert default controller module data into system table
	// ***** MAKE MORE DYNAMIC LATERS ******
	db.query('INSERT INTO system VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
		null, 'node', 'sprinkler controller', 'F', 0, 0, 
		{mode: 'dynamic', ip: '0.0.0.0', subnet: '0.0.0.0', gw:'0.0.0.0', dns1:'0.0.0.0', dns2:'0.0.0.0'},
		{ssid: '', bssid: '', security_type: '', username: '', password: '', mode: 'dynamic', ip: '0.0.0.0', subnet: '0.0.0.0', gw:'0.0.0.0', dns1:'0.0.0.0', dns2:'0.0.0.0'},
		{mode: 'coordinator', serial: '0013a20040790728', pan: 'green eggs and ham'}]);
		console.log(" |---------    Defaults loaded    ---------|");

	// remotes should be added by the user

	// if sensors/actuators exist add them to the sensor table and create separate table per input
	// adding two sensors for temperature and humidity for testing
	addSensor('temp0', 'onboard temperature sensor', 'local');
	addSensor('hum0', 'onboard humidity sensor', 'local');
}

//********* REMOTE METHODS *********

// add a remote (xbee) sensor/actuator to database
db_management.prototype.addRemote = function(rname, rserial, rinputs, routputs) {
	// should call addSensor() / addActuator (if needed also)
}

//********* ACTUATOR METHODS *********

// add an output to actuator table for user interface
function addActuator(aname, desc, location) {
	db.query('INSERT into actuators VALUES (?, ?, ?)', [aname, desc, location]);
	console.log(" |---------    Added actuator     ---------|");
}

// retrieve list of all actuators (outputs)
db_management.prototype.getActuators = function(fn) {
	db.query('SELECT * FROM actuators', {id: String, desc: String, loc: String}, function(rows) {
		fn(rows);
	});
}

//********* SENSOR METHODS *********

// add a sensor to sensor table, and create a table for sensor entries
function addSensor(sid, desc, location) {
	db.query('INSERT into sensors VALUES (?, ?, ?)', [sid, desc, location]);
	db.query('CREATE TABLE IF NOT EXISTS ' + sid + ' (time INTEGER PRIMARY KEY, value REAL)');
	console.log(" |---------      Added sensor     ---------|");
}

// retrieve list of all sensors
db_management.prototype.getSensors = function(fn) {
	db.query('SELECT * FROM sensors', {id: String, desc: String, loc: String}, function(rows) {
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
		// create json ?
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
