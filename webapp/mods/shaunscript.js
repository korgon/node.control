var pin_lookup = {
'P9_11':30,	'P8_03':38,	'P8_28':88,
'P9_12':60,	'P8_04':39,	'P8_29':87,
'P9_13':31,	'P8_05':34,	'P8_30':89,
'P9_14':50,	'P8_06':35,	'P8_31':10,
'P9_15':48,	'P8_07':66,	'P8_32':11,
'P9_16':51,	'P8_08':67,	'P8_33':9,
'P9_17':5,	'P8_09':69,	'P8_34':81,
'P9_18':4,	'P8_10':68,	'P8_35':8,
'P9_19':13,	'P8_11':45,	'P8_36':80,
'P9_20':12,	'P8_12':44,	'P8_37':78,
'P9_21':3,	'P8_13':23,	'P8_38':79,
'P9_22':2,	'P8_14':26,	'P8_39':76,
'P9_23':49,	'P8_15':47,	'P8_40':77,
'P9_24':15,	'P8_16':46,	'P8_41':74,
'P9_25':117,	'P8_17':27,	'P8_42':75,
'P9_26':14,	'P8_18':65,	'P8_43':72,
'P9_27':115,	'P8_19':22,	'P8_44':73,
'P9_28':113,	'P8_20':63,	'P8_45':70,
'P9_29':111,	'P8_21':62,	'P8_46':71,
'P9_30':112,	'P8_22':37,
'P9_31':110,	'P8_23':36,
'P9_41A':20,	'P8_24':33,
'P9_41B':116,	'P8_25':1,
'P9_42A':7,	'P8_26':61,
'P9_42B':114,	'P8_27':86
}

var exec = require('child_process').exec
var file = require('fs');

function shaunscript(){
	//console.log('Welcome to shaunscript :3');
}

function readPin(pin, callback){
	exec('cat /sys/class/gpio/gpio'+pin_lookup[pin]+'/value', function(err, stdout, stderr){
		var pin_val = parseInt(stdout);
		callback(pin_val);
	});
}

function writePin(pin, value, callback){
	exec('echo out > /sys/class/gpio/gpio'+pin_lookup[pin]+'/direction', function(err,stdout,stderr){
	if(err) throw err;
		exec('echo ' + value + ' > /sys/class/gpio/gpio'+pin_lookup[pin]+'/value', function(err,stdout,stderr){
			//console.log('wrote to pin ' + pin + ': ' + value);
			if (callback) callback();
		});
	});
}

shaunscript.prototype.digitalWrite = function(pin, value, callback){
	if ((value.toString().match(/(HIGH)|(high)|(1)|hi/))) value = 1;
	if ((value.toString().match(/(LOW)|(low)|0|lo/))) value = 0;
	file.exists('/sys/class/gpio/gpio' + pin_lookup[pin]+'/', function(exists){
		if(!exists){
			exec('echo ' + pin_lookup[pin] + ' > /sys/class/gpio/export', function(error, stdout, stderr){
				if (error) throw error;
				writePin(pin, value, callback);
			});
		}
		else {
			writePin(pin, value, callback)
		}
	});
}

shaunscript.prototype.digitalRead = function(pin, callback){
	file.exists('/sys/class/gpio/gpio' + pin_lookup[pin]+'/', function(exists){
		if(!exists){
			//console.log('echo ' + pin_lookup[pin] + ' > /sys/class/gpio/export');
			exec('echo ' + pin_lookup[pin] + ' > /sys/class/gpio/export', function(error, stdout, stderr){
				if (error) throw error;
				readPin(pin, function(res){
					callback(res);
				});
			});
		}
		else readPin(pin, function(res){
			callback(res);
		});
	});
}

module.exports = shaunscript;

//shaun = new shaunscript()
//shaunscript.digitalWrite('P9_27','0');
//shaunscript.digitalRead('P9_27', function(res){
//	console.log('result is ' + res);
//});
