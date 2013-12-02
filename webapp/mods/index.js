//	node.control modules
//  integration of different modules here:
//  database, board control, eth0, wlan0, xbee
// ---------------------------------------------------
//  Currently contains:
//	|--- dataman.js
//	|--- wifi.js
//	|--- xbee.js
//	|--- 
// ---------------------------------------------------

var exec = require('child_process').exec
var fs = require('fs');

// data management
var database = require("./dataman.js");
var db = new database();
// wifi scan and connection
var wireless = require("./wifi.js");
var wifi = new wireless("wlan0");
// xbee management
var bees = require("./xbee.js");
var xbee = new bees("/dev/ttyO4");

// xbee json types
var xbeehive = require('./config/xbee_types.json');

// controller variables
var sys_hostname;
var sys_desc;
var sys_temp_display;
var sys_ap_mode;
var sys_setup;

//********* Controller Constructor *********
function controller() {
	console.log(" |---[ Instantiating controller object ]---|");
	updateSystemVariables();
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

//********* XBee Configure on discovery *********

xbee.on('newNode', function(newnode) {
	db.getRemote(newnode.hex_identifier, function(results) {
		if (results == null) {
			var identified = 0;
			for (var worker in xbeehive.workers) {
				if (newnode.id == xbeehive.workers[worker].id) {
					identified = 1;
					console.log(Date() + ' (xbee) [discover] collecting a workerbee ' + worker + ': ' + newnode.id);
					db.addRemote(xbeehive.workers[worker].id, newnode.hex_identifier, xbeehive.workers[worker].name, xbeehive.workers[worker].inputs, xbeehive.workers[worker].outputs);
				}
			}
			if (identified == 0)
				console.log(Date() + ' (xbee) [discover] found a rogue bee!');
		}
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
		if (error) throw error;
	});
}

//********* Get and/or Set Private Variables *********
controller.prototype.getSetup = function() {
	return sys_setup;
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

//********* Exports *********
controller.prototype.db = db;
controller.prototype.wifi = wifi;
controller.prototype.xbee = xbee;
controller.prototype.updateSystemVariables = updateSystemVariables;
module.exports = controller;
