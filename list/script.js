// display string, refered in entry[].type
var singer_lookup = [
	"", 		// 0b 0000
	"看谷にぃあ",	//    0001
	"胡桃澤もも",	//    0010
	"ももにぃあ",	//    0011
	"逢魔きらら",	//    0100
	"きらにぃあ",	//    0101
	"ももきら",	//    0110
	"ぷちここ",	//    0111
	"ゆこち",  	//    1001
	"ちゅいたゃ"	//    1100
];

var display_order = [
	-1,		// 0000
	7, 		// 0001
	6,		// 0010
	4,		// 0010
	5,		// 0100
	3,		// 0101
	2,		// 0110
	1,		// 0111
	9,		// 1001
	8,		// 1100
]

// stores whats currently looking up
var loading = "";

// stores enabled singer data
var singer_chosen = [1, 1, 1];

// store song id (song[id]) of folded up songs
var hide_song = new Array();

$(document).ready(function() {
	if ($("#input").val() !== "") {
		search();
	}
});

$(function() {
	// search
	$(document).on("blur", "#input", function() {
		search();
	});
	
	// enter -> blur
	$(document).on("keydown", function(e) {
		if (e.keyCode === 13) {
			$("#input").blur();
		}
	});
	
	// singer selection
	$(document).on("click", ".singer_select", function() {
		var e = this.innerHTML;
		var selected = -1;
		switch (e) {
			case "逢魔きらら":
				selected = 2;
				break;
			case "胡桃澤もも":
				selected = 1;
				break;
			case "看谷にぃあ":
				selected = 0;
				break;
		}
		singer_chosen[selected] ^= 1;
		$(".sing_sel_" + selected).toggleClass("selected");
		update_display();
	});
	
	// hide song
	$(document).on("click", ".song_name_container", function() {
		var e = parseInt($(this).attr("id"));
		if(!hide_song.includes(e)){
			hide_song.push(e);
		}else{
			hide_song.splice(hide_song.indexOf(e), 1);
		}
		update_display();
	})
});

// display date in yyyy-MM-dd format
function display_date(input) {
	var e = new Date(input);
	return (e.getFullYear() + "-" + fill_digit(e.getMonth() + 1, 2) + "-" + fill_digit(e.getDate(), 2));
}

// add 0 in front of a number
function fill_digit(input, target_length) {
	e = "" + input;
	while (e.length < target_length) {
		e = "0" + e;
	}
	return e;
}

var hits = new Array(150);
var hit_counter = 0;

function search() {
	var e = $("#input").val();
	if (e === loading) {
		return;
	}
	loading = e;
	if (e === "") {
		// clear current list
		$("#display").html("");
		return;
	}
	// not empty input
	var f = new Array(200);
	var counter = 0;
	for (var i = 0; i < song.length; ++i) {
		if (song[i].name.toLowerCase().includes(e.toLowerCase()) ||
			song[i].reading.toLowerCase().includes(e.toLowerCase())
		) {
			f[counter++] = i;
		}
		if (counter === 200) {
			break;
		}
	}
	// sort f in reading order
	f.sort(function compareFn(a, b) {
		return song[a].id - song[b].id;
	});
	hit_counter = 0;
	for (var i = 0; i < counter; ++i) {
		for (var j = 0; j < entry.length; ++j) {
			if (f[i] === entry[j].song) {
				hits[hit_counter++] = j;
			}
			if (hit_counter >= 150) {
				break;
			}
		}
		if (hit_counter >= 150) {
			break;
		}
	}
	update_display();
}

function update_display() {
	$("#display").html("");
	var current_song = -1;
	var sel_member = 7;
	for (var i in singer_chosen) {
		if (!singer_chosen[i]) {
			sel_member -= 1 << i;
		}
	}
	var loaded_count = 0;
	for (var i = 0; i < hit_counter; ++i) {
		// check if all member
		if (sel_member !== 7) {
			var flag = -1;
			switch (entry[hits[i]].type) {
				case 8 : 
					flag = 9;
					break;
				case 9 : 
					flag = 12;
					break;
				default :
					flag = entry[hits[i]].type;
			}
			if (!(sel_member & flag)) {
				continue;
			}
		}
		loaded_count++;
		// if new song
		if (current_song !== entry[hits[i]].song) {
			current_song = entry[hits[i]].song;
			// if hide the song
			var show = !hide_song.includes(current_song);
			document.getElementById("display").innerHTML +=  (
			"<div class=\"song_name_container\" id=\"" + current_song + "\">" +
				"<div class=\"song_rap\">" +
					"<div class=\"song_name\">" + song[entry[hits[i]].song].name + "</div>" +
					(show ? ("<div class=\"song_credit" + (song[entry[hits[i]].song].credit.length > 30 ? " long_credit" : "") + "\">" + song[entry[hits[i]].song].credit + "</div>") : "") +
				"</div>" +
				"<div id=\"fold_" + current_song + "\" class=\"" + (show ? "song_fold_open" : "song_fold_close") + "\"></div>" +
			"</div>");
		}
		// skip all records if hidden
		if (hide_song.includes(current_song)) {
			continue;
		}
		var is_mem = entry[hits[i]].note.includes("【メン限");
		var no_note = entry[hits[i]].note === "" || entry[hits[i]].note === "【メン限】" || entry[hits[i]].note === "【メン限アーカイブ】";
		var note = entry[hits[i]].note;
		if (is_mem) {
			if (entry[hits[i]].note.includes("メン限アーカイブ"))　{
				note = note.replace(/【メン限アーカイブ】/g, "");
			} else {
				note = note.replace(/【メン限】/g, "");
			}
		}
		var e = "<div class=\"entry_container singer_" + entry[hits[i]].type + (is_mem ? "m" : "") + "\"><a href=\"https://youtu.be/" + video[entry[hits[i]].video].id + (entry[hits[i]].ts === 0 ? "" : ("?t=" + entry[hits[i]].time)) +"\" target=\"_blank\"><div class=\"entry_primary\"><div class=\"entry_date\">" + display_date(video[entry[hits[i]].video].date) + "</div><div class=\"entry_singer\">" + singer_lookup[entry[hits[i]].type] + "</div><div class=\"mem_display\">" + (is_mem ? "メン限" : "") + "</div></div>" + (no_note ? "" : ("<div class=\"entry_note\">" + note + "</div>")) + "</a></div>";
		/*var e = "<div><span class=\"url\"><a href=\"https://youtu.be/" + video[entry[hits[i]].video].id +
			 (entry[hits[i]].ts === 0 ? "" : ("?t=" + entry[hits[i]].time)) +"\" target=\"_blank\">" +
			 display_date(video[entry[hits[i]].video].date) + "</a></span><span class=\"singer_t" + entry[hits[i]].type +
			 (is_mem ? " mem" : "") + "\">" + singer_lookup[entry[hits[i]].type] +
			 "</span><span class=\"note\">" + entry[hits[i]].note + "</span></div>";*/
		document.getElementById("display").innerHTML += e;
	}
}

// todo
// remove hide id if no longer exist
