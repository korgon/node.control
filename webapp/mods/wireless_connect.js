var sys = require('sys')
var fs = require('fs')
var exec = require('child_process').exec

var connJSON

function terminal_output(command, callback){
	exec(command, function(error, stdout, stderr){
		callback(stdout);
	});
}

function wireless_connect(jsonIn){
	connJSON = jsonIn
} 

wireless_connect.prototype.connect = function(callback){
	terminal_output('touch wpa_supplicant.conf', function(stdout){
		console.log('wpa_supplicant.conf created');
	});
	

	if (connJSON.security.match(/WEP/)){
		var stream = fs.createWriteStream("./wpa_supplicant.conf");
		stream.once('open', function(close){
			stream.write('ctrl_interface=/var/run/wpa_supplicant\n');
			stream.write('ctrl_interface_group=0\n');
			stream.write('update_config=1\n');
			stream.write('network={\n');
			stream.write('\tssid="'+connJSON.ssid+'"\n');
			stream.write('\tkey_mgmt=NONE\n');
			stream.write('\twep_key0='+connJSON.password+'\n');
			stream.write('}')
			stream.end();
			terminal_output('wpa_supplicant -Dwext -iwlan0 -c ./wpa_supplicant.conf -B', function(stdout){
				console.log('Is it hanging...?');
				terminal_output('udhcpc -i wlan0', function(stdout){
					console.log('Please do not hang :3');
				});
			});
		});
	}

	if (connJSON.security.match(/WPA/)){
		var stream = fs.createWriteStream('./wpa_supplicant.conf');
		stream.once('open', function(close){
			stream.write('ctrl_interface=/var/run/wpa_supplicant\n');
			stream.write('ctrl_interface_group=0\n');
			stream.write('update_config=1\n');
			stream.write('network={\n');
			stream.write('\tssid="'+connJSON.ssid+'"\n');
			stream.write('\tkey_mgmt='+connJSON.security+'\n');
			console.log('HERE');
			if(connJSON.security.match(/PSK/)){
				stream.write('\tpsk="'+connJSON.password+'"\n');
			}
			if(connJSON.group){
				stream.write('\tgroup='+connJSON.group+'\n');
			}
			stream.write('}');
			stream.end();
			terminal_output('wpa_supplicant -Dwext -iwlan0 -c ./wpa_supplicant.conf -B', function(stdout){
				console.log('Hangin?');
				terminal_output('udhcpc -i wlan0', function(stdout){
					console.log('Please do not hang :3');
				});
			});
		});
	}
}
module.exports = wireless_connect
//Test the module
//var JSONin = {"ssid":"RajNetwork","password":"e65d7a1414e6e34bc874ebdb69", "security":"WEP"}
var JSONin = {"ssid":"traegalia","password":"ADAB1C21BD82347205BB3B0156","security":"WPA-PSK"};
var victorycount = 0;
var Connect = new wireless_connect(JSONin)
Connect.connect();
setInterval(function(){
	victorycount++;
	console.log(victorycount + ': VICTORY!')}, 1000);
			
