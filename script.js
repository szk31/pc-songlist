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
	"",			//    1000
	"ゆこち",  	//    1001
	"しろ",		//    1010
	"",			//    1011
	"小悪熊ちゅい",	//    1100
	"",			//    1101
	"",			//    1110
	"",			//    1111
];

var display_order = [
	-1,		// 0000
	7, 		// 0001
	6,		// 0010
	4,		// 0011
	5,		// 0100
	3,		// 0101
	2,		// 0110
	1,		// 0111
	-1,		// 1000
	14,		// 1001
	13,		// 1010
	11,		// 1011
	12,		// 1100
	10,		// 1101
	9,		// 1110
	8,		// 1111
];

var series_lookup = {
	"マクロス" : ["マクロス", "まくろす"],
	"ラブライブ" : ["ラブライブ", "らぶらいぶ", "LL", "ll"],
	"物語シリーズ" : ["物語シリーズ", "ものがたりしりーず", "ものがたりシリーズ"],
	"まどまぎ" : ["まどまぎ", "まどマギ", "まどか"],
	"アイマス" : ["アイマス", "あいます", "デレマス", "でれます"],
	"洋楽" : ["洋楽"],
	"Disney" : ["Disney", "ディズニー", "でぃずにー"],
	"ジブリ" : ["ジブリ", "じぶり"]
}

// stores whats currently looking up
var loading = "";

// stores enabled singer data
var singer_chosen = [1, 1, 1];

// store song id (song[id]) of folded up songs
var hide_song = new Array();

// max display song count
const max_display = 120;

// if searching through song names or artist names
var searching_song_name = true;

$(document).ready(function() {
	if ($("#input").val() !== "") {
		search();
	}
});

$(function() {
	// return to top of page (anchor to top does not work as nav bar exists)
	$(document).on("click", "#nav_to_top", function() {
		$('html,body').scrollTop(0);
	});
	
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
	
	// switch between input method
	$(document).on("click", "#switch_method", function() {
		$("#input").val("");
		searching_song_name ^= 1;
		$("#input").attr("placeholder", searching_song_name ? "曲名/読みで検索" : "アーティスト名で検索");
		$("#display").html("");
		loading = "";
		$("#input").focus();
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
		loading = "";
		search();
	});
	
	// hide song
	$(document).on("click", ".song_name_container", function() {
		var e = parseInt($(this).attr("id"));
		if(!hide_song.includes(e)){
			hide_song.push(e);
		}else{
			hide_song.splice(hide_song.indexOf(e), 1);
		}
		if (loading === "") {
			return;
		}
		$(".song_" + e).toggleClass("hidden");
		$("#fold_" + e).toggleClass("closed");
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

var hits = new Array(max_display);
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
	var series_name = "";
	for (var i in series_lookup) {
		for (var j in series_lookup[i]) {
			if (series_lookup[i].includes(e)) {
				series_name = i;
				break;
			}
		}
		if (series_name !== "") {
			break;
		}
	}
	var f = new Array(200);
	var counter = 0;
	for (var i = 1; i < song.length; ++i) {
		if (searching_song_name) {
			if (series_name !== "") {
				if (song[i].reading.includes(series_name) || song[i].attr.includes(series_name)) {
					f[counter++] = i;
				}
			} else {
				if (song[i].name.toLowerCase().includes(e.toLowerCase()) ||
					song[i].reading.toLowerCase().includes(e.toLowerCase())
				) {
					f[counter++] = i;
				}
			}
		} else {
			if (song[i].credit.toLowerCase().includes(e.toLowerCase())
			) {
				f[counter++] = i;
			}
		}
		if (counter === 200) {
			break;
		}
	}
	hit_counter = 0;
	for (var i = 0; i < counter; ++i) {
		// defintly improve here not to do a 2d search
		for (var j = 0; j < entry.length; ++j) {
			if (f[i] === entry[j].song) {
				if (is_private(j)) {
					continue;
				}
				hits[hit_counter++] = j;
			}
			if (hit_counter >= max_display) {
				break;
			}
		}
		if (hit_counter >= max_display) {
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
	// record loaded song (for un-hiding song thats no longer loaded)
	var loaded_song = new Array();
	var loaded_count = 0;
	var new_html = "";
	for (var i = 0; i < hit_counter; ++i) {
		// check if all member
		if (sel_member !== 7) {
			if (!(sel_member & entry[hits[i]].type)) {
				continue;
			}
		}
		// if new song
		if (current_song !== entry[hits[i]].song) {
			new_html += ((current_song !== -1 ? "</div>" : "") + "<div class=\"song_container\">");
			current_song = entry[hits[i]].song;
			loaded_song[loaded_count++] = current_song;
			// if hide the song
			var show = !hide_song.includes(current_song);
			new_html += (
			"<div class=\"song_name_container " + (loaded_count % 2 === 0 ? "odd_colour" : "even_colour") + "\" id=\"" + current_song + "\">" +
				"<div class=\"song_rap\">" +
					"<div class=\"song_name\">" + song[entry[hits[i]].song].name + "</div>" +
					(show ? ("<div class=\"song_credit" + (song[entry[hits[i]].song].credit.length > 30 ? " long_credit" : "") + " song_" + current_song + "\">" + song[entry[hits[i]].song].credit + "</div>") : "") +
				"</div>" +
				"<div id=\"fold_" + current_song + "\" class=\"song_fold_icon" + (show ? "" : " closed") + "\"></div>" +
			"</div>");
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
		new_html += ("<div class=\"entry_container singer_" + entry[hits[i]].type + (is_mem ? "m" : "") + " song_" + current_song + (hide_song.includes(current_song) ? " hidden" : "") + "\"><a href=\"https://youtu.be/" + video[entry[hits[i]].video].id + (entry[hits[i]].ts === 0 ? "" : ("?t=" + entry[hits[i]].time)) +"\" target=\"_blank\"><div class=\"entry_primary\"><div class=\"entry_date\">" + display_date(video[entry[hits[i]].video].date) + "</div><div class=\"entry_singer\">" + singer_lookup[entry[hits[i]].type] + "</div><div class=\"mem_display\">" + (is_mem ? "メン限" : "") + "</div></div>" + (no_note ? "" : ("<div class=\"entry_note\">" + note + "</div>")) + "</a></div>");
	}
	$("#display").html(new_html + "</div>");
	// check all hiden songs
	for (var i = 0; i < hide_song.length; ++i) {
		// if song havnt been laoded, remove from hide list
		if (!loaded_song.includes(hide_song[i])) {
			hide_song.splice(i--, 1);
		}
	}
}

function is_private(index) {
	return entry[index].note.includes("非公開") || entry[index].note.includes("記録用") || entry[index].note.includes("アーカイブなし");
}
