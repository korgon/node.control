// System Control
// for node.control...ler...
// ---------------------------------------------------
// Listing of exported methods:
//	|--- updateSystem(expects db object)
// ---------------------------------------------------

// module requirements
var fs = require('fs');

// public variables
sysctrl.prototype.setupChk = 0;

// constructor...
function sysctrl(dbase) {
	// would expect to get pin data and such here...
	// going to try to pass the dbase for initial settings
	// like wifi settings etc... for boot setup.
}


sysctrl.prototype.updateSystem = function(dbase) {
	// should do stuff!
}

module.exports = sysctrl;
