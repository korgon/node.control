var wizPage = 1;

function wizard(page, wmax, dir) {
	// set image opacity

	var curImg = document.getElementById(page + "img" + wizPage);
	var prevImg = document.getElementById(page + "img" + (wizPage - 1));
	var nextImg = document.getElementById(page + "img" + (wizPage + 1));
	var curWiz = document.getElementById(page + wizPage);
	var prevWiz = document.getElementById(page + (wizPage - 1));
	var nextWiz = document.getElementById(page + (wizPage + 1));

	if (dir == 'next') {
		curWiz.style.display = "none";
		curImg.style.opacity = 1;
		nextWiz.style.display = "block";
		nextImg.style.opacity = 0.5;
		wizPage++;
	}
	else if (dir == 'prev') {
		curWiz.style.display = "none";
		curImg.style.opacity = 1;
		prevWiz.style.display = "block";
		prevImg.style.opacity = 0.5;
		wizPage--;
	}

	if (wizPage > 1) {
		document.getElementById(page + "Prev").style.visibility = "visible";
	} else {
		document.getElementById(page + "Prev").style.visibility = "hidden";
	}

	if (wizPage <= wmax) {
		document.getElementById(page + "Next").style.visibility = "visible";
	} else {
		document.getElementById(page + "Next").style.visibility = "hidden";
		document.getElementById(page + "Submit").style.visibility = "visible";
	}
}

function wifiselect(id, wificnt) {
	var ids = [];
	
	for (var i=0; i < wificnt; i++) {
		if (id == 'w'+i) {
			ids[i] = document.getElementById('w' + i);
			ids[i].classList.add('setupwifisel');
		} else {
			ids[i] = document.getElementById('w' + i);
			ids[i].classList.remove('setupwifisel');			
		}
	}
}

function validateForm() {
	var x = document.forms["setup"]["password"].value;
	if (x == null || x == "")
  {
		alert("C'mon no password?");
		return false;
	}
}

function ipMode(iface) {
	var mode = document.getElementById(iface + '_mode').value;
	var ip = document.getElementById(iface + '_ip');
	var subnet = document.getElementById(iface + '_subnet');
	var gw = document.getElementById(iface + '_gw');
	var dns1 = document.getElementById(iface + '_dns1');
	var dns2 = document.getElementById(iface + '_dns2');
	if (mode == 'dynamic') {
		ip.disabled = true;
		subnet.disabled = true;
		gw.disabled = true;
		dns1.disabled = true;
		dns2.disabled = true;
	} else if (mode == 'static') {
		ip.disabled = false;
		subnet.disabled = false;
		gw.disabled = false;
		dns1.disabled = false;
		dns2.disabled = false;
	}
}
