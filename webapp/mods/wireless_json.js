var sys = require('sys')
var fs = require('fs')
var exec = require('child_process').exec
var wireless_interface


//Wireless_scan constructor
function wireless_scan(_interface){
	wireless_interface = _interface
	}

//Function for executing command in *NIX terminal. Output is sent to callback
function terminal_output(command, callback){
	exec(command, function(error, stdout, stderr){
		callback(stdout);
	});
}


wireless_scan.prototype.getData = function(callback){
	terminal_output('wpa_cli scan ' + wireless_interface, function(info){
		console.log('scanned');
		terminal_output('wpa_cli scan_results', function(output){
			console.log('getting results');
			callback(output);
		});
		});
	
}

wireless_scan.prototype.parseData = function(data, callback){
	//Creating the search parameters
	var bssid = /[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}/g
	var frequency = /\t[0-9]{4}\t/g;
	var encryption = /\s+(\[[A-Z\-0-9\+]+\])+/g;
	var siglevel = /\t[0-9]{1,3}\t/g;
	var ssid = /\]\s+[\s<>\w\-\(\)]+(?=\s+)/g

	console.log('processing data')
	console.log(data);
	
	macAddress = data.match(bssid);
	frequencyInt = data.match(frequency);
	security = data.match(encryption);
	sigLevelInt = data.match(siglevel);
	SSID = data.match(ssid);

	for (freq in frequencyInt){
		frequencyInt[freq] = frequencyInt[freq].replace(/\t/g,'');
	}
	
	for (siglev in sigLevelInt){
		sigLevelInt[siglev] = sigLevelInt[siglev].replace(/\t/g,'');
	}

	for (id in SSID){
		SSID[id] = SSID[id].replace(/]\t/g,'');
	}

	for (sec in security){
		security[sec] = security[sec].replace(/\t/g, '');
	}
	
	console.log(security);
	callback(SSID, security, sigLevelInt, frequencyInt, macAddress);
	}

wireless_scan.prototype.generateJSON = function(SSID, security, sigLevelInt, frequencyInt, macAddress, callback){
	var jsonarr = [];
	for (stuff in SSID){
		jsonarr.push({"SSID": SSID[stuff], "Security_type": security[stuff], "Sig_Strength": sigLevelInt[stuff], "Frequency": frequencyInt[stuff], "Mac_address": macAddress[stuff]});
		}
	callback({Networks: jsonarr});
	};

wireless_scan.prototype.scan = function(callback){
	var thisref = this;
	thisref.getData(function(data){
		thisref.parseData(data, function(SSID, security, sigLevelInt, frequencyInt, macAddress){
			thisref.generateJSON(SSID, security, sigLevelInt, frequencyInt, macAddress, function(isDone){
				callback(isDone);	
			});
		});

	});
}
	

module.exports = wireless_scan

var wire = new wireless_scan('wlan0');

wire.scan(function(json_output){
	console.log(json_output);
});


