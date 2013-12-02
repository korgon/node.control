var sys = require('sys')
var fs = require('fs')
var exec = require('child_process').exec
var wireless_interface


//Wireless_scan constructor
function wireless_scan(_interface){
	wireless_interface = _interface
	}

wireless_scan.prototype.getData = function(callback){
	exec("sudo /sbin/iwlist wlan0 scanning | egrep 'Cell |Encryption|Quality|Last beacon|ESSID|((IE: WPA(2)?)|WPA(2)?|WEP)|(Signal level)'", function(error, stdout, stderr){
		callback(stdout);
	});
}

wireless_scan.prototype.getIPaddress = function(callback){
	var inet_regex = /inet (([0-9]{1,3}.){3}[0-9]{1,3})/g
	exec('ip addr show ' + wireless_interface, function(ip_address, stdout, stderr){
		if(ip_address)
			callback(ip_address.match(inet_regex)[0].split('inet ')[1]);
		else		
			callback('Either not connected to internet or interface selected was wrong')
	});
}

wireless_scan.prototype.parseData = function(data, callback){
	data = data.split(/Cell /g)
	obj_arr = []
	data.shift()
	console.log(data);
	var encryption = /(WEP|(WPA2?))/g
	var bssid = /[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}:[0-9a-zA-z]{1,2}/g
	var essid = /ESSID:"[<a-zA-Z0-9_\->\.]+"/g
	var sig_level = /Signal level=[0-9]+/g
	for (info in data){
		data[info] = data[info].replace(/\n/g, '');
		data_enc = (data[info].match(encryption))
		if(data_enc == null)
			data_enc = 'N/A';
		if(data_enc.toString().match(/WPA/g))
			data_enc = data_enc.toString().replace(/WPA(2)?/,'WPA').replace(/\,WPA2/,'');
		data_enc = data_enc.toString()
		data_bssid = data[info].match(bssid).toString();
		data_ssid = (data[info].match(essid)).toString().replace(/ESSID:/g,'').replace(/"/g,'');
		data_level = (data[info].match(sig_level)).toString().replace(/Signal level=/g,'');
		obj_arr.push({'encryption':data_enc, 'bssid':data_bssid, 'ssid':data_ssid,'sig_level':data_level})

	}
	
	console.log(obj_arr)
	for (info in data)

	console.log('processing data')
	
	callback(obj_arr)
}


wireless_scan.prototype.scan = function(callback){
	var thisref = this;
	thisref.getData(function(data){
		thisref.parseData(data, function(obj_array){
				callback(obj_array);	
		});
	});
}

	

module.exports = wireless_scan

var wire = new wireless_scan('wlan0');

wire.scan(function(json_output){
	console.log(json_output); 
});

wire.getIPaddress(function(stuff){
	console.log(stuff);
});



