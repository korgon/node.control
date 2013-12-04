/*************************************************************
Shaun Raj and Kevin Hogg
Code to communicate with the si7005 temp/humidity i2c device

*/////////////////////////////////////////////////////////////

var i2c = require('i2c');


var si7005_address = 0x40;
var type;
var si7k5;

function si7005(_type) {
	this.type = _type;
	si7k5 = new i2c(si7005_address, {device: '/dev/i2c-1', debug: false});
}

si7005.prototype.getValue = function(callback){
	var conv_type
	if (this.type.match(/temp/i)) {
		conv_type = 0x11;
	}
	else if (this.type.match(/hum/i)) {
		conv_type = 0x01;
	}
	else callback('Cannot read input type. Did you mean temp or humid?...moron');
	si7k5.writeBytes(0x03,[conv_type],function(err){
	//console.log(err);
	si7k5.readBytes(0x01, 2, function(err, res){
		//console.log('Conversion Results')		
		if(conv_type == 0x11 ) callback(temp_conversion(res));
		else if (conv_type == 0x01) callback(humid_conversion(res));
		else callback('Did not return anything');
		});
	});
}

function temp_conversion(buff){
	temp_hex = buff.readInt16BE(0);
	var res_celsius = [temp_hex >> 2]/32.0 - 50;
	return(res_celsius);
}

function humid_conversion(buff){
	humid_hex = buff.readInt16BE(0);
	//console.log(buff);
	var res_humid = [humid_hex >> 4]/16.0 - 24;
	return(res_humid);
}

module.exports = si7005;

