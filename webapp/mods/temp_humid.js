var i2c = require('i2c');
var event = require('events');

adjustor = new event.EventEmitter();

var si7005_address = 0x27;

var temp_obj, type, zone;

function si7005(){
	temp_obj = new i2c(si7005_address, {device: '/dev/i2c-1', debug: false});
}


si7005.prototype.getResults = function(callback){
	temp_obj.readBytes(0x01, 4, function(err, res){
		//console.log(err,res);
		conversion(res, function(res_obj){
			//console.log(res_obj);
			callback(res_obj);
		});
	});
}

function conversion(buff,callback){
	temp_hex = buff.readInt16BE(2) >> 2
	humid_hex = (buff.readInt16BE(0)) & 0x3FFF
	//console.log(humid_hex);
	res_humidity = (humid_hex/(Math.pow(2,14) -1 )) * 100.0
	res_celsius = (temp_hex/(Math.pow(2,14) - 1))*165 - 40;
	callback({'temp':res_celsius, 'humidity':res_humidity});
}

module.exports = si7005;

/*
 things = new si7005();
things.getResults(function(err,res){
	console.log(err,res);
});
*/
