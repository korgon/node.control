// add data to sensor tables for plotting tests...

// module requirements
var fs = require('fs');
var crypto = require('crypto');
var dblite = require('dblite');

// module variables
var db_path = './database/data.sqlite';
var db = dblite(db_path);


// log sensor data with timestamp
function putData(sid, time, rawdata) {
	db.query('INSERT into ' + sid + ' VALUES (?, ?)', [time, rawdata]);
}

var now = new Date();
console.log(now.getTime() + ' = ' + now);
var oneDay = 24*60*60*1000;
var offset = 40*oneDay;
var past = new Date(now.getTime() - offset);
console.log(past.getTime() + ' = ' + past);

var timeSpan = now.getTime() - past.getTime();

// simulate slow change in temp

every = 250;					// decrease every x
logevery = 60000;		// log every minute (in milliseconds)
var start = 70;			// start temp
var tempmax = 110;
var tempmin = -30
var rando = 0;
for (i=0; i<timeSpan/logevery; i++) {
	if (i%every == 0) {
		rando = Math.random()/3;
		rando = start - rando;

		start = rando;
		if (start > tempmax)
			start--;
		else if (start < tempmin)
			start++;
	}
	else {
		if (Math.floor(Math.random()*2) == 0)
			rando = rando + Math.random()/3;
		else
			rando = rando - Math.random()/3;
	}
	//putData('temp0', new Date(i*60000 + past.getTime()).getTime(), rando.toFixed(2));
	console.log(new Date(i*60000 + past.getTime()) + " " + new Date(i*60000 + past.getTime()).getTime() + " " + rando.toFixed(2));
}
console.log("done...");
