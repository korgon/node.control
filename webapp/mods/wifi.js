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

//********* Wifi Scanning Functions *********
wireless.prototype.getData = function(callback){
	exec("sudo /sbin/iwlist wlan0 scanning | egrep 'Cell |Encryption|Quality|Last beacon|ESSID|((IE: WPA(2)?)|WPA(2)?|WEP)|(Signal level)|(Authentication Suites)'", {timeout:5000}, function(error, stdout, stderr){
		callback(stdout);
	});
}

wireless.prototype.parseData = function(data, callback){
	console.log(data);
	data = data.split(/Cell /g);
	obj_arr = [];
	data.shift();
	console.log(data);
	var encryption = /(WEP|(WPA2?))/g;
	var enc_onoff = /Encryption key:(on|off)/g;
	var bssid = /[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}/g;
	var essid = /ESSID:"[<a-zA-Z0-9_\->\.]+"/g;
	var sig_level = /Signal level=[0-9]+/g;
	var auth_suite = /Authentication Suites \([1-9]\) : [A-Z]+/;
	for (info in data){
		data[info] = data[info].replace(/\n/g, '');
		data_enc = (data[info].match(encryption));
		data_suite = data[info].match(auth_suite);
		if (data_suite == null)
			data_suite = '';
		data_suite = data_suite.toString().replace(/Authentication Suites \([1-9]\) : /,'-');
		if(data_enc == null)
			data_enc = 'N/A';
		if(data_enc.toString().match(/WPA/g))
			data_enc = data_enc.toString().replace(/WPA(2)?/,'WPA').replace(/\,WPA2/,'') + data_suite;
		data_enc = data_enc.toString()
		data_bssid = data[info].match(bssid).toString();
		data_ssid = (data[info].match(essid)).toString().replace(/ESSID:/g,'').replace(/"/g,'');
		data_level = (data[info].match(sig_level)).toString().replace(/Signal level=/g,'');
		enc_switch = (data[info].match(enc_onoff)).toString().replace(/Encryption key:/,'');
		if((enc_switch == 'on') && (data_enc == 'N/A'))
			data_enc = 'WEP';
		obj_arr.push({'encryption':data_enc, 'bssid':data_bssid, 'ssid':data_ssid,'sig_level':data_level});

	}
	callback(obj_arr);
}


wireless.prototype.scan = function(callback){
	var thisref = this;
	thisref.getData(function(data){
		thisref.parseData(data, function(obj_array){
				callback(obj_array);	
		});
	});
}

//********* Get IP address *************
wireless.prototype.getIPaddress = function(callback){
	var inet_regex = /inet (([0-9]{1,3}.){3}[0-9]{1,3})/g
	exec('ip addr show ' + wireless_interface, function(error, ip_address, stderr){
		console.log(error, ip_address,stderr);
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
wireless.prototype.getConnmanKey = function(ssid,callback){
	exec('/usr/lib/connman/test/test-connman services', function(error, stdout, stderr){
		console.log(stdout);
		if(stdout.match(ssid)){
			stdout_regex = new RegExp (ssid + '\\s+{ [a-zA-Z0-9_]+ }','g')
			console.log(stdout.match(stdout_regex).toString())
			callback(stdout.match(stdout_regex).toString())
		}
		callback(null);
	});
}

wireless.prototype.connect = function(connJSON, callback){
	this.getConnmanKey(connJSON.ssid,function(wireless_key){
		console.log('key is ' + wireless_key);
		if (wireless_key == null) callback('SSID not in range');
		else{
			wireless_key = wireless_key.replace(connJSON.ssid,'').replace(/{\s/g,'')
			var stream = fs.createWriteStream('/var/lib/connman/wifi.config');
			stream.once('open', function(close){
				stream.write('[service_home]\n');
				stream.write('Type = wifi\n');
				stream.write('Name = ' + connJSON.ssid + '\n');
				stream.write('Security ='+connJSON.security+'\n');
				stream.write('Passphrase = ' + connJSON.password + '\n');
				stream.end();
			});
			exec('/usr/lib/connman/test/test-connman connect ' + wireless_key,function(){});
		}
	});	
}	

module.exports = wireless;
/*
var JSONin = {"bssid":"00:23:69:46:b2:12","ssid":"traegalia","username":"", "password":"ADAB1C21BD82347205BB3B0156", "security_type":"[WPA2-PSK-TKIP][ESS]"};
var wifi = new wireless;
wifi.connect(JSONin, function() {
	console.log("connected?");
});
*/
