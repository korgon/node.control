// Used for creating tabs with buttons
function create_buttons(tabid) {
	$this = $('#' + tabid);
	if (tabid == 'pop_actuators') {
		var slot_array = actuator_array;
	}	else if (tabid == 'pop_sensors') {
		var slot_array = sensor_array;
	}
	var slot_class = 'buttonDrag';
	var buttons = slot_array.length;		
	// enable scroll buttons based on number of elements
	if (buttons > tab_slots) {
		$this.data('scrollable', 1);
		$this.children("div[id^='" + tabid + "_scroll']").css('opacity', .5).hover( function() {
			$(this).css({'opacity': 1, 'cursor': 'pointer'});
		}, function () {
			$(this).css('opacity', .5);
		});
		$this.children("div[id^='" + tabid + "_scrollup']").click(function() {
			move_slot_index(tabid, 'up');
		});
		$this.children("div[id^='" + tabid + "_scrolldown']").click(function() {
			move_slot_index(tabid, 'down');
		});
	}
	// create buttons from slot_array
	var top_offset = 0;
	for (var button=0; button < buttons; button++) {
		if (top_offset > 225) top_offset = 0;
		var newbutton = "<div id='" + tabid + "_button" + button+1 + "' class='" + slot_class + "' title='";
		newbutton = newbutton + slot_array[button].alias + "' style='top: " + top_offset + "px;";
		if (button > tab_slots-1)	// don't display anything beyond slot numbers
			newbutton = newbutton + " display: none;'>";
		else
			newbutton = newbutton + "'>";
		newbutton = newbutton + "<img class='buttonImage' src='" + slot_array[button].icon + "'></div>";
		$('#' + tabid + '_slots').append(newbutton);
		$('#' + tabid + '_button' + button+1).data('arrayid', button);
		top_offset = top_offset + 75;
	}
	$("div[id^='" + tabid + "_button']").hover(function () {
		$(this).css('box-shadow', '0px 0px 31px 1px #252525 inset, 0px 0px 6px #000');
	}, function () {
		$(this).css('box-shadow', '');
	});
	makeDraggable(tabid);
}

function move_slot_index(tabid, dir) {
	if (tabid == 'pop_actuators') {
		var buttons = actuator_array.length;
		var index = actuator_index;
	}	else if (tabid == 'pop_sensors') {
		var buttons = sensor_array.length;
		var index = sensor_index;
	}
	// hide all buttons;
	$("div[id^='" + tabid + "_button']").hide();
	var index_max = Math.floor(buttons/tab_slots) - 1;
	var unfilled = buttons%tab_slots;
	if (unfilled > 0) index_max++;
	var padding = tab_slots;
	index_max = index_max*tab_slots;
	if (dir == 'up') {
		if (index == 0) index = index_max;
		else index -= tab_slots;
	} else if (dir == 'down') {
		if (index == index_max) index = 0;
		else index += tab_slots;
	}
	if (index == index_max)
		if (unfilled > 0) padding = unfilled;
	$("div[id^='" + tabid + "_button']").slice(index,index+padding).show();
	if (tabid == 'pop_actuators') actuator_index = index;
	else if (tabid == 'pop_sensors') sensor_index = index;
}

function disable_tab(tabid) {
	$('#' + tabid).css('opacity', .15);
	$("div[id^='" + tabid + "_button']").css('cursor', 'default').unbind('mouseenter mouseleave');
	if ($('#' + tabid).data('scrollable') == 1) {
		$("div[id^='" + tabid + "_scroll']").css('cursor', 'default').unbind('mouseenter mouseleave click');
	}
	$("div[id^='" + tabid + "_button']").draggable('disable');
}

function enable_tab(tabid) {
	$('#' + tabid).css('opacity', 1);
	$("div[id^='" + tabid + "_button']").hover( function () {
		$(this).css('box-shadow', '0px 0px 31px 1px #252525 inset, 0px 0px 6px #000');
	}, function () {
		$(this).css('box-shadow', '');
	});
	if ($('#' + tabid).data('scrollable') == 1) {
		$("div[id^='" + tabid + "_scroll']").css('opacity', .5).hover( function() {
			$(this).css({'opacity': 1, 'cursor': 'pointer'});
		}, function () {
			$(this).css('opacity', .5);
		});
		$("div[id^='" + tabid + "_scrollup']").click(function() {
			move_slot_index(tabid, 'up');
		});
		$("div[id^='" + tabid + "_scrolldown']").click(function() {
			move_slot_index(tabid, 'down');
		});
	}
	$("div[id^='" + tabid + "_button']").css('cursor', 'move').draggable('enable');
}

function makeDraggable(tabid) {
	$("div[id^='" + tabid + "_button']").draggable( {
		containment: '#pop_dragzone',
		stack: "div[id^='" + tabid + "_button']",
		revert: true,
		helper: 'clone',
		start: function(event, ui) {
			ui.helper.css('z-index', 33);
		},
		stop: function(e, ui) {
			ui.helper.css('z-index', 5);
		}
	});
}

// Function for preventing invalid duration entries
function keyup_checkDuration(event) {
	var value = $(this).val();
	if(value.length >= 1) {
		var char = value.substring(value.length - 1);
		if(isNaN(char)) {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		}
	}
}

// Function for preventing invalid time entries
function keyup_checkTime(event) {
	var value = $(this).val();
	if(value.length == 1) {
		char = value.substring(value.length - 1);
		if(isNaN(char)) {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		}
	}
	if(value.length == 2) {
		char = value.substring(value.length - 1);
		if(isNaN(char)) {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		} else {
			$(this).val(value + ':');
		}
	}
	if(value.length == 3) {
		char = value.substring(value.length - 1);
		if(char != ':') {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		}
	}
	if(value.length == 4) {
		char = value.substring(value.length - 1);
		if(isNaN(char)) {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		}
	}
	if(value.length == 5) {
		char = value.substring(value.length - 1);
		if(isNaN(char)) {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		}
	}
	if(value.length == 6) {
		char = value.substring(value.length - 1);
		if(char != ':') {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		}
	}
	if(value.length > 6) {
		char = value.substring(value.length - 1);
		if(isNaN(char)) {
			var newval = value.substring(0, value.length - 1);
			$(this).val(newval);
		}
	}
	if(value.length > 8) {
		char = value.substring(value.length - 1);
		var newval = value.substring(0, value.length - 1);
		$(this).val(newval);
	}
}
