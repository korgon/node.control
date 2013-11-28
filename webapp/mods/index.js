//	node.control modules
//  integration of different modules here:
//  database, board control, eth0, wlan0, xbee
// ---------------------------------------------------
//  Currently contains:
//	|--- dataman.js
//	|--- wifi.js
//	|--- 
//	|--- 
// ---------------------------------------------------

var exec = require('child_process').exec

// data management
var database = require("./dataman.js");
var db = new database();
// wifi scan and connection
var wireless = require("./wifi.js");
var wifi = new wireless("wlan0");

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

// run terminal commands
function terminal_output(command, callback){
	exec(command, function(error, stdout, stderr){
		      callback(error, stdout, stderr);
	});
}

//********* Run a few linux commands *********

controller.prototype.shutdown = function(timedate) {
	terminal_output('sudo /sbin/shutdown now' , function(error, stdout, stderr) {
		if (error) throw error;
	});
}

controller.prototype.reboot = function(timedate) {
	terminal_output('sudo /sbin/reboot' , function(error, stdout, stderr) {
		if (error) throw error;
	});
}

controller.prototype.setTimeDate = function() {
	terminal_output('sudo /bin/date -s @'+timedate, function(error, stdout, stderr) {
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
controller.prototype.updateSystemVariables = updateSystemVariables;
module.exports = controller;
