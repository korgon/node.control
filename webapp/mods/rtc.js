// RTC Module

var exec = require('child_process').exec

function rtc() {
	this.init(function(err) {
		//if (err) console.log(err);
	});
}

rtc.prototype.init = function(callback){
	exec('echo ds1307 0x68 > /sys/class/i2c-adapter/i2c-1/new_device', function(error, stdout, stderr){
		//console.log(error, stdout,stderr);
		callback(error, stdout,stderr);
	});
}

rtc.prototype.writeTosystem = function(callback){
	exec('sudo /sbin/hwclock -s -f /dev/rtc1', function(error, stdout, stderr){
		exec('sudo /sbin/hwclock -w', function(error, stdout, stderr){
			callback(error, stdout,stderr);
		});
	});
}

rtc.prototype.writeToclock = function(callback){
	exec('sudo /sbin/hwclock -w -f /dev/rtc1', function(error, stdout, stderr){
		callback(error, stdout, stderr);
	});
}

rtc.prototype.readClock = function(callback){
	exec('sudo /sbin/hwclock -r -f /dev/rtc1', function(error, stdout, stderr){
		callback(error, stdout,stderr);
	});
}

module.exports = rtc;

/*
rtc = new rtc();

rtc.readClock(function(error, stdout,stderr){
	console.log(error, stdout,stderr);
	rtc.writeToclock(function(error, stdout,stderr){
		console.log(error, stdout,stderr)
		rtc.readClock(function(error, stdout,stderr){
			console.log(error, stdout,stderr);
		});
	});
});
*/
