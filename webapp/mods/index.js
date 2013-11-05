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

// data management
var database = require("./dataman.js");
var db = new database();
// wifi scan and connection
var wireless = require("./wifi.js");
var wifi = new wireless("wlan0");

// controller variables
var hostname;
var setup;

//********* Controller Constructor *********
function controller() {
	console.log (" |--- [Instantiating controller object]");
	updateSystemVariables();
}

// pull system settings from database
function updateSystemVariables() {
	db.setupPull(function(data) {
		hostname = data.hostname;
		setup = data.setup;
	});
}

//********* Get and/or Set Private Variables *********
controller.prototype.getSetup = function() {
	return setup;
}

controller.prototype.getHostname = function() {
	return hostname;
}

controller.prototype.db = db;
controller.prototype.wifi = wifi;
controller.prototype.updateSystemVariables = updateSystemVariables;
module.exports = controller;
