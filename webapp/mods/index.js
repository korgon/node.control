//	node.control modules
//  integration of different modules here:
//  database, board control, eth0, wlan0, xbee
// ---------------------------------------------------
//  Currently contains:
//	|--- dataman.js
//	|--- wifi.js
//	|--- xbee.js
//	|--- si7005.js
//	|--- shaunscript.js
//	|--- scheduler.js
// ---------------------------------------------------

var exec = require('child_process').exec
var events = require('events');
var fs = require('fs');
var Async = require('async');
var mastacontroller;

// data management
var database = require("./dataman.js");
var db = new database();
// gpio control (shaunscript)
var shaunscript = require("./shaunscript.js");
var gpio = new shaunscript();
// scheduler object
var schedge = require("./scheduler.js");
// wifi scan and connection
var wireless = require("./wifi.js");
var wifi = new wireless("wlan0");
// xbee management
var bee_com = require("./xbee.js");
var xbee = new bee_com("/dev/ttyO2");  //UART2
// si7005 temp/humidity
var si7005 = require("./temp_humid.js");
var temphumid = new si7005();
var temp0_value = 0;
//var hum0 = new si7005("humid");
var hum0_value = 0;
// RTC
var rtc = require("./rtc.js");
var clock = new rtc();
// xbee json types
var xbeehive = require('../config/xbee_types.json');

// actuator array for control
var zones = {};
var bees = {};

// controller variables
var sys_hostname;
var sys_desc;
var sys_temp_display;
var sys_ap_mode;
var sys_setup;

//********* Controller Constructor *********
function controller() {
	mastacontroller = this;
	console.log(" |---[ Instantiating controller object ]---|");
	events.EventEmitter.call(this);
	// get controller variables from json file
	// fill zones array with zone data from file
	// add zones (actuators to the database if needed

	// initialize RTC
	clock.writeTosystem(function(err, stout, morecrap) {
		//console.log('changing the time ' + err + stout + morecrap);
	});

	// fill zones from database entries
	db.getActuators('local', function(actuators) {
		for (var actuator in actuators)
		{
			zones[actuators[actuator].name] = actuators[actuator];
		}
		//console.log('got ' + Object.keys(zones).length + ' zones...');
		initZones();
	});

	updateSystemVariables();
	
	// check sensor status every minute
	setInterval(function() {
		temphumid.getResults(function(res) {
			//console.log('temp: ', res);
			temp0_value = res.temp;
			db.putSensorData('temp0', temp0_value);
			hum0_value = res.humidity;
			db.putSensorData('hum0', hum0_value);
		});
	}, 30000);
}

// pull settings from database
function updateSystemVariables() {
	db.setupPull(function(data) {
		sys_hostname = data.hostname;
		sys_desc = data.description;
		sys_setup = data.setup;
		sys_temp_display = data.temp_mode;
		sys_ap_mode = data.ap_mode;
	});
}

//********* Zone Control and Status *********

function initZones() {
	Async.forEach (Object.keys(zones), function(azone) {
		gpio.digitalWrite(zones[azone].pin, 0, function() {
			gpio.digitalRead(zones[azone].pin, function(res) {
				zones[azone].status = res;
			});
		});
	});
}

controller.prototype.controlZone = function(azone, value) {
	var self = this;
	//console.log('attempting to activate ' + zones[azone].name + '@' + zones[azone].pin + '=>' + value);
	gpio.digitalWrite(zones[azone].pin, value, function() {
		gpio.digitalRead(zones[azone].pin, function(res) {
			zones[azone].status = res;
			self.emit('zoneChange');
		});
	});
}

//********* XBee Control and Status *********

// Xbee control with emit
controller.prototype.controlBee = function(bee, port, value) {
	var self = this;
	console.log('attempting to activate ' + bee + '@' + port + '=>' + value);
	xbee.write(bee, bees[bee].outputs[port].pin, value);
	bees[bee].outputs[port].status = value;
	self.emit('beeChange', bees);
}

// XBee Configure on discovery
xbee.on('newNode', function(newnode) {
	db.getRemote(newnode.hex_identifier, function(results) {
		if (results == null) {
			var identified = 0;
			for (var worker in xbeehive) {
				if (newnode.id == worker) {
					identified = 1;
					console.log(Date() + ' (xbee) [discover] collecting a workerbee: ' + newnode.id);
					db.addRemote(xbeehive[worker].id, newnode.hex_identifier, xbeehive[worker].name, xbeehive[worker].inputs, xbeehive[worker].outputs);
					// add bee to bees
					bees[newnode.hex_identifier] = {'id': newnode.id, 'outputs': xbeehive[worker].outputs, 'inputs': xbeehive[worker].inputs, 'status': 0};
				}
			}
			if (identified == 0)
				console.log(Date() + ' (xbee) [discover] found a rogue bee!');
		}
		else {
			console.log(Date() + ' (xbee) [discover] identified a workerbee: ' + newnode.id);
			// add bee to bees
			bees[newnode.hex_identifier] = {'id': newnode.id, 'outputs': xbeehive[newnode.id].outputs, 'inputs': xbeehive[newnode.id].inputs, 'status': 0};			
		}
		mastacontroller.emit('beeChange');
	});
});


//********* Run a few linux commands *********
controller.prototype.shutdown = function(timedate) {
	exec('sudo /sbin/shutdown now' , function(error, stdout, stderr) {
		if (error) throw error;
	});
}

controller.prototype.reboot = function() {
	exec('sudo /sbin/reboot' , function(error, stdout, stderr) {
		if (error) throw error;
	});
}

controller.prototype.setTimeDate = function(timedate) {
	exec('sudo /bin/date -s @'+timedate, function(error, stdout, stderr) {
		clock.writeToclock(function(error) {
			if (error) throw error;
		});
	});
}

//********* Get Variables *********
controller.prototype.getSetup = function() {
	return sys_setup;
}

controller.prototype.getTemperature = function() {
	return temp0_value;
}

controller.prototype.getHumidity = function() {
	return hum0_value;
}

controller.prototype.getHostname = function() {
	return sys_hostname;
}

controller.prototype.getAPmode = function() {
	return sys_ap_mode;
}

controller.prototype.getTempdisplay = function() {
	return sys_temp_display;
}

controller.prototype.getDesc = function() {
	return sys_desc;
}

// inherit event emitter
controller.prototype.__proto__ = events.EventEmitter.prototype;


//********* Exports *********
controller.prototype.bees = bees;
controller.prototype.zones = zones;
controller.prototype.db = db;
controller.prototype.wifi = wifi;
controller.prototype.xbee = xbee;
controller.prototype.updateSystemVariables = updateSystemVariables;
module.exports = controller;
