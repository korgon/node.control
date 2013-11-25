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
function terminal_output(command, callback){
	exec(command, function(error, stdout, stderr){
		callback(error, stdout, stderr);
	});
}

//********* Wifi Scanning Functions *********
function getData(callback){
	terminal_output('sudo /usr/sbin/wpa_cli scan ' + wireless_interface, function(error, info, stderr){
		terminal_output('sudo /usr/sbin/wpa_cli scan_results', function(error, output, stderr){
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
	

	if (connJSON.security_type.match(/WEP/)){
		var stream = fs.createWriteStream("./config/wpa_supplicant.conf");
		stream.once('open', function(close){
			stream.write('ctrl_interface=/var/run/wpa_supplicant\n');
			stream.write('ctrl_interface_group=nodectrl\n');
			stream.write('update_config=1\n');
			stream.write('network={\n');
			stream.write('\tssid="'+connJSON.ssid+'"\n');
			stream.write('\tkey_mgmt=NONE\n');
			stream.write('\twep_key0='+connJSON.password+'\n');
			stream.write('}')
			stream.end();
			current_date = new Date().getTime();
			current_time = current_date.getTime();
			terminal_output('sudo /usr/sbin/wpa_supplicant -Dwext -iwlan0 -c ./config/wpa_supplicant.conf -B', function(error, stdout, stderr){
				console.log('Is it hanging...?');
				setInterval(function(){
					now_date = Date();
					now_time = now_date.getTime();
					if(now_time - current_time > 45000){
						throw 'Cannot connect to network. Check your settings and try again';
						}
					}, 2000);
				terminal_output('sudo /sbin/udhcpc -i wlan0', function(error, stdout, stderr){
					console.log('Please do not hang :3')
				});
			});
		});
	}

	if (connJSON.security_type.match(/WPA/)){
		var stream = fs.createWriteStream('./config/wpa_supplicant.conf');
		stream.once('open', function(close){
			stream.write('ctrl_interface=/var/run/wpa_supplicant\n');
			stream.write('ctrl_interface_group=0\n');
			stream.write('update_config=1\n');
			stream.write('network={\n');
			stream.write('\tssid="'+connJSON.ssid+'"\n');
			stream.write('\tkey_mgmt='+connJSON.security_type.match(/WPA/)[0]+'-'+connJSON.security_type.match(/(PEAP|PSK|EAP)/)[0]+'\n');
			if (connJSON.security_type.match(/EAP/)){
				stream.write('\teap=PEAP\n');
				stream.write('\tidentity="'+connJSON.username+'"\n');
				stream.write('\tphase2="autheap=GTC"\n');
				stream.write('\tpassword="'+connJSON.password+'"\n');
			}
			stream.write('\tbssid='+connJSON.bssid+'\n');
			console.log('HERE');
			if(connJSON.security_type.match(/PSK/)){
				stream.write('\tpsk="'+connJSON.password+'"\n');
			}
			if(connJSON.group){
				stream.write('\tgroup='+connJSON.group+'\n');
			}
			stream.write('}');
			stream.end();
			console.log('Password?\n');
			terminal_output('sudo /usr/sbin/wpa_supplicant -Dwext -iwlan0 -c ./config/wpa_supplicant.conf -B', function(error, stdout, stderr){
				console.log(error, stdout, stderr);
				if(error | stderr) throw error;
				console.log('Pass Here?');
				//var i = 0;
				terminal_output('sudo /sbin/udhcpc -i wlan0', function(error, stdout, stderr){
//					setInterval(function(){i++;}, 2000);
//					console.log(i);
//					if( i == 45){
//						throw "Cannot connect, check your connection settings";}
					console.log(error, stdout, stderr);
//					if(error | stderr) throw error;
					console.log('Please do not hang :3');
					callback('Here is your damn callback');
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
