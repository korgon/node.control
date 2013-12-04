/*************************************************************
Shaun Raj
Code to communicate with the Xbee module
Sample usage is shown below

var stuff = new xbee_comm('/dev/ttyO4')

stuff.init(function(things){
	console.log(things);
		for (remote in things){
			if('REMOTEONE' == things[remote].id){
				stuff.write(things[remote].hex_identifier, 'DIO2','DIGITAL_OUTPUT_HIGH', function(node){
					stuff.read(things[remote].hex_identifier,'DIO2', function(res){
						console.log(res);
					});
				});
			}
		}		
});

The above snippet does all(init, read, write)

For each individual portion:

INIT:

xbee.init(function(remote_array){
	console.log(remote_array);
}

WRITE:
Assuming an init is completed and one is writing to a detected remote_array

xbee.write(hex_identifier, pin, direction, function(node){
	//Do whatever is needed
});

hex_identifier is the hex code of the remote split into an array of bytes converted to integers(ex 0x0013a20040a9c987 -> [ 0, 19, 162, 0, 64, 169, 201, 135 ]), Only is needed if not using info from the output from the init method

pin is the pin that is desired to be manipulated ex 'DIO2'

direction is the desired direction: DIGITAL_INPUT - converts pin to an input (not needed if using the read method)
				    DIGITAL_OUTPUT_HIGH - sends a '1'
				    DIGITAL_OUTPUT_LOW - sends a '0'

READ:
Assuming an init is completed and one is reading to a detected remote_array

xbee.read(hex_identifier,pin, function(res){
	console.log(res);
});

hex_identifier is the hex code of the remote split into an array of bytes converted to integers(ex 0x0013a20040a9c987 -> [ 0, 19, 162, 0, 64, 169, 201, 135 ]), Only is needed if not using info from remote_array from the init method

pin is the pin that is desired to be manipulated ex 'DIO2'
*/
				    

var xbee = require('svd-xbee');
var parser = require('./parser.js');
var util = require('util');

var remote_arr = []
var node_arr = []
	

function xbee_comm(_port){
	xbeecoord = new xbee.XBee({port: _port, baudrate: 9600, api_mode: 1}).init();
	this.xbeecoord = xbeecoord
}

xbee_comm.prototype.init = function(callback){
	self = this;
	this.xbeecoord.on('initialized', function(params){
		console.log('initialized with params: ' + util.inspect(params));
		self.xbeecoord.discover();
	});

	this.xbeecoord.on('discoveryEnd',function(){
		callback(remote_arr);
//		self.xbeecoord.discover();
	});

	this.xbeecoord.on('newNodeDiscovered',function(node){
		console.log(node.remote64.hex)
		//Split Hex string into array of byte strings
		var id = node.remote64.hex.match(/../g)

		//Convert each byte string to an Int
		for (str in id){
			id[str] = parseInt(id[str],16)
		}
		console.log(id);
		obj = {'id':node.id,'hex_identifier':id}
		remote_arr.push(obj);
	});
}

xbee_comm.prototype.write = function(hex_ident, pin, direction, callback){
	var xbeenode = this.xbeecoord.addNode(hex_ident, parser);
	xbeenode.setPinMode(pin,direction)
	callback(xbeenode)
}

xbee_comm.prototype.read = function(hex_ident, pin, callback){
	var xbeeNode = this.xbeecoord.addNode(hex_ident, parser); 
	xbeeNode.getDigitalPin(pin, function(err,res){
		callback(res);
	});
}

xbee_comm.prototype.manual = function(id, hex_ident){
	remote_array.push({'id': id, 'hex_identifier': hex_ident});
}

module.exports = xbee_comm;

var stuff = new xbee_comm('/dev/ttyO2')
stuff.init(function(things){
	console.log(things);
		for (remote in things){
			if('node:12vdc_x5' == things[remote].id){
				stuff.write(things[remote].hex_identifier, 'DIO0','DIGITAL_OUTPUT_HIGH', function(node){
					stuff.read(things[remote].hex_identifier,'DIO0', function(res){
						console.log('pin on? ', res);
						//stuff.write(things[remote].hex_identifier, 'DIO2', 'DIGITAL_OUTPUT_LOW',function(node){console.log('writing 2')});
					});
				});
			}
		}		
});

var stuff2 = new xbee_comm('/dev/ttyO2')
stuff2.init();



