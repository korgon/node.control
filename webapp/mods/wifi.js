// Wifi Module
// Manages wifi interface for node.control
// ---------------------------------------------------
// Listing of exported methods:
//  |--- scan(callback)
//  |--- connect(json, callback)
// ---------------------------------------------------

// module requirements
var sys = require('sys')
var fs = require('fs')
var exec = require('child_process').exec

// module variables
var wireless_interface;
var wlan0_ip;

//********* Wifi Constructor *********
function wireless(_interface){
	wireless_interface = _interface;
}

// function for executing command in *NIX terminal. Output is sent to callback
function terminal_output(/*command,options,callback*/){

	_default = { encoding: 'utf8', timeout: 0,maxBuffer: 200*1024,killSignal: 'SIGTERM',cwd: null,env: null }

	command = arguments[0];

	console.log('type of argument is ' + typeof arguments[2])

	if((typeof arguments[1]) == 'object'){
		options = arguments[1];
		callback = arguments[2];
	}

	else if ((typeof arguments[1]) == 'function'){
		options = _default;
		callback = arguments[1];
	}
	
	else
		callback(new Error ('Give me some legit parameters...'));

	exec(command,options, function(error, stdout, stderr){
		callback(error, stdout, stderr);
	});
}

//********* Wifi Scanning Functions *********
function getData(callback, useEmp){	
	terminal_output('pgrep wpa', function(error, stdout, stderr){
		console.log(error, stdout, stderr);				
		if((stdout == '') || (useEmp == 1)){
			terminal_output('sudo /usr/sbin/wpa_supplicant -Dwext -iwlan0 -c ./mods/empty_wpa_supplicant.conf', function(error, stdout, stderr){
				console.log(error, stdout, stderr);				
				console.log('reinitializing wpa_supplicant');
			});
		}
	});			
	terminal_output('sudo /usr/sbin/wpa_cli scan ' + wireless_interface, function(info){
		terminal_output('pwd', function(error,output,stderr){
			console.log(output);
		});
		console.log('scanned');
		terminal_output('sudo /usr/sbin/wpa_cli scan_results', function(error,output,stderr){
			console.log('getting results');
			callback(output);
		});
	});	
}

function parseScan(data, callback){
	//Creating the search parameters
	var bssid = /[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}/g;
	var frequency = /\t[0-9]{4}\t/g;
	var encryption = /\s+(\[[A-Z\-0-9\+]+\])+/g;
	var siglevel = /\t[0-9]{1,3}\t/g;
	var ssid = /\]\s+[\s<>\w\-\(\)]+(?=\s+)/g
	
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

	callback(SSID, security, sigLevelInt, frequencyInt, macAddress);
}

function generateJSON(SSID, security, sigLevelInt, frequencyInt, macAddress, callback){
	var jsonarr = [];
	for (stuff in SSID){
		jsonarr.push({"ssid": SSID[stuff], "security_type": security[stuff], "sig_strength": sigLevelInt[stuff], "frequency": frequencyInt[stuff], "mac_address": macAddress[stuff]});
		}
	callback({networks:jsonarr});
	};

wireless.prototype.scan = function(callback) {
	getData(function(data) {
		parseScan(data, function(SSID, security, sigLevelInt, frequencyInt, macAddress) {
			generateJSON(SSID, security, sigLevelInt, frequencyInt, macAddress, function(isDone) {
				callback(isDone);	
			});
		});
	});
}

//********* Get IP address *************
wireless.prototype.getIPaddress = function(callback){
	var inet_regex = /inet (([0-9]{1,3}.){3}[0-9]{1,3})/g
	terminal_output('ip addr show ' + wireless_interface, function(ip_address, stdout, stderr){
		if(ip_address)
			callback(ip_address.match(inet_regex)[0].split('inet ')[1]);
		else		
			callback('Either not connected to internet or interface selected was wrong')
	});
}

wireless.prototype.getIP = function() {
	return wlan0_ip;
}

//********* Wifi Connect Function *********
wireless.prototype.connect = function(connJSON, callback){
	terminal_output('sudo /usr/bin/killall wpa_supplicant', function(error, stdout, stderr){
		console.log('wlan0 removed');
	});
	

	if (connJSON.security.match(/WEP/)){
		var stream = fs.createWriteStream("./mods/wpa_supplicant.conf");
		stream.once('open', function(close){
			stream.write('ctrl_interface=/var/run/wpa_supplicant\n');
			
stream.write('ctrl_interface_group=0\n');
//stream.write('ctrl_interface_group=nodectrl\n');
			stream.write('update_config=1\n');
			stream.write('network={\n');
			stream.write('\tssid="'+connJSON.ssid+'"\n');
			stream.write('\tkey_mgmt=NONE\n');
			stream.write('\twep_key0='+connJSON.password+'\n');
			stream.write('}')
			stream.end();
						terminal_output('sudo /usr/sbin/wpa_supplicant -Dwext -iwlan0 -c ./mods/wpa_supplicant.conf',{ encoding: 'utf8',timeout: 40000,maxBuffer: 200*1024,killSignal: 'SIGTERM',cwd: null,env: null }, function(error, stdout, stderr){
				console.log(error, stdout, stderr);
				if(error | stderr) throw error;
				terminal_output('sudo /sbin/udhcpc -i wlan0' ,{ encoding: 'utf8',timeout: 1000,maxBuffer: 200*1024,killSignal: 'SIGTERM',cwd: null,env: null }, function(error, stdout, stderr){
					console.log(error, stdout, stderr);
					console.log('Please do not hang :3');
				});
			});
		});
	}

	if (connJSON.security.match(/WPA/)){
		var stream = fs.createWriteStream('./mods/wpa_supplicant.conf');
		stream.once('open', function(close){
			stream.write('ctrl_interface=/var/run/wpa_supplicant\n');
			stream.write('ctrl_interface_group=0\n');
			stream.write('update_config=1\n');
			stream.write('network={\n');
			stream.write('\tssid="'+connJSON.ssid+'"\n');
			stream.write('\tkey_mgmt='+connJSON.security+'\n');
			if (connJSON.security.match(/EAP/)){
				stream.write('\teap='+connJSON.special+'\n');
				stream.write('\tidentity="'+connJSON.username+'"\n');
				stream.write('\tphase2="autheap='+connJSON.eaptype+'"\n');
				stream.write('\tpassword="'+connJSON.password+'"\n');
			}
			if (connJSON.bssid)
				stream.write('\tbssid='+connJSON.bssid+'\n');
			if(connJSON.security.match(/PSK/)){
				stream.write('\tpsk="'+connJSON.password+'"\n');
			}
			if(connJSON.group){
				stream.write('\tgroup='+connJSON.group+'\n');
			}
			stream.write('}');
			stream.end();
			terminal_output('sudo /usr/sbin/wpa_supplicant -Dwext -iwlan0 -c ./mods/wpa_supplicant.conf -B',{ encoding: 'utf8',timeout: 1000,maxBuffer: 200*1024,killSignal: 'SIGTERM',cwd: null,env: null }, function(error, stdout, stderr){
				console.log(error, stdout, stderr);
				if(error | stderr) throw error;
				terminal_output('sudo /sbin/udhcpc -t 3 -i wlan0' ,{ encoding: 'utf8',timeout: 20,maxBuffer: 200*1024,killSignal: 'SIGTERM',cwd: null,env: null }, function(error, stdout, stderr){
					console.log(error, stdout, stderr);
					console.log('Please do not hang :3');
				});
			});
		});
	}
}


module.exports = wireless;
/*
var JSONin = {"bssid":"00:23:69:46:b2:12","ssid":"traegalia","username":"", "password":"ADAB1C21BD82347205BB3B0156", "security_type":"[WPA2-PSK-TKIP][ESS]"};
var wifi = new wireless;
wifi.connect(JSONin, function() {
	console.log("connected?");
});
*/
