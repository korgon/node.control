/*************************************************************
Shaun Raj and Kevin Hogg
Code to communicate with the Xbee module

xbees should be configured in AP mode (coordinator at least)
and with a common PANID, encryption has been tested minimally

*/////////////////////////////////////////////////////////////

var xbee = require('svd-xbee');
var parser = require('./parser.js');
var util = require('util');
var events = require('events');

var xbeecoord;

function xbee_comm(_port){
	events.EventEmitter.call(this);
	xbeecoord = new xbee.XBee({port: _port, baudrate: 9600, api_mode: 1}).init();
}

xbee_comm.prototype.init = function(callback) {
	var self = this;
	xbeecoord.on('initialized', function(params) {
		//console.log('initialized with params: ' + util.inspect(params));
		xbeecoord.discover();
	});

	xbeecoord.on('discoveryEnd',function() {
		xbeecoord.discover();
	});

	xbeecoord.on('newNodeDiscovered',function(node) {
		//console.log(node.remote64.hex)
		//Split Hex string into array of byte strings
		var id = node.remote64.hex.match(/../g);
		var strid = '';
		//Convert each byte string to an Int and also to a csv version
		for (str in id){
			id[str] = parseInt(id[str], 16)
		}
		// convert to csv string for db storage
		strid = id.join(",");

		obj = {'id':node.id, 'hex_identifier':strid}
		self.emit('newNode', obj);
	});
}

//********* XBee Functions *********
xbee_comm.prototype.write = function(hex_ident, pin, direction) {
	// convert from csv string to int array
	var hex_id = hex_ident.split(',');
	for (str in hex_id){
		hex_id[str] = parseInt(hex_id[str]);
	}
	var xbeenode = xbeecoord.addNode(hex_id, parser);
	xbeenode.setPinMode(pin, direction);
}

xbee_comm.prototype.read = function(hex_ident, pin, callback) {
	// convert from csv string to int array
	var hex_id = hex_ident.split(',');
	for (str in hex_id){
		hex_id[str] = parseInt(hex_id[str]);
	}
	var xbeeNode = xbeecoord.addNode(hex_id, parser); 
	xbeeNode.getDigitalPin(pin, function(err, res){
		callback(res);
	});
}

// inherit event emitter
xbee_comm.prototype.__proto__ = events.EventEmitter.prototype;


module.exports = xbee_comm;


