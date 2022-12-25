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

// series search
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

// indices lookup
var entry_idx = {
	song_id : 0,
	video : 1,
	note : 2,
	time : 3,
	type : 4
};
var song_idx = {
	name : 0,
	artist : 1,
	reading : 2,
	attr : 3
};
var video_idx = {
	id : 0,
	date : 1
};

var build_version = "2022-12-26-2";

/* control / memories */
// stores whats currently looking up
var loading = "";

// stores enabled singer data
var singer_chosen = [1, 1, 1];

// store song id (song[id]) of folded up songs
var hide_song = new Array();

// if searching through song names or artist names
var searching_song_name = true;

// current page id
var current_page = 0;

/*  page IDs
 *
 *  0 : search
 *  1 : repertoire
 */

/* setting section */
// max display song count
var max_display = 100;

// if on, display private entries despite not accessable
var do_display_hidden = false;


// ram for searching (entry_processed)
//var entry_proc = new Array(song.length).fill([]);

$(document).ready(function() {
	$("#input").val("");
	/*
	for (var i = 0; i < entry.length; ++i) {
		entry_proc[entry[i][0]].push(i);
		console.log("pushing " + i + " into entry_proc[" + entry[i][0] + "]", entry_proc[entry[i][0]].length);
	}*/
	$("#info_version").html(build_version);
	$("#info_last-update").html(video[video.length - 1][video_idx.date]);
});

$(function() {
	// calling menu
	$(document).on("click", "#nav_menu", function() {
		$("#menu_container").toggleClass("hidden");
		$("#nav_menu").toggleClass("menu_opened");
	});
	
	// click on fog to close menu
	$(document).on("click", "#menu_container", function(e) {
		if (!($(e.target).parents(".defog").length || $(e.target).hasClass("defog"))) {
			$("#menu_container").addClass("hidden");
			$("#nav_menu").removeClass("menu_opened");
		}
	});
	
	// menu to page
	$(document).on("click", ".menu2page", function(e) {
		var target = ($(e.target).attr("id")).replace("menu2page_", "");
		var target_id = -1;
		switch (target) {
			case "search" :
				target_id = 0;
				break;
			case "repertoire" :
				target_id = 1;
				break;
		}
		if (target_id !== current_page) {
			current_page = target_id;
			$(".menu2page_selected").removeClass("menu2page_selected");
			$("#" + $(e.target).attr("id")).addClass("menu2page_selected");
			// nothing implemented here
			$("#menu_container").addClass("hidden");
			$("#nav_menu").removeClass("menu_opened");
		}
	});
	
	// menu information
	$(document).on("click", "#menu_info", function() {
		$("#information").removeClass("hidden");
		$("#menu_container").addClass("hidden");
		$("#nav_menu").removeClass("menu_opened");
	});
	
	// menu settings
	$(document).on("click", "#menu_setting", function() {
		$("#setting").removeClass("hidden");
		$("#menu_container").addClass("hidden");
		$("#nav_menu").removeClass("menu_opened");
	});
	
	// return from info
	$(document).on("click", "#information", function(e) {
		if (!($(e.target).parents(".defog").length ||  $(e.target).hasClass("defog"))) {
			$("#information").addClass("hidden");
		}
	});
	
	// do diplay hidden switch update
	$(document).on("change", ".toggle_switch", function(e) {
		do_display_hidden = e.target.checked;
	});
	
	// settings reset to default
	$(document).on("click", "#setting_default", function() {
		// revert value
		max_display = 100;
		do_display_hidden = false;
		
		// update display
		$("#setting_max-display_value").html(max_display);
		$("#setting_display-private_checkbox").prop("checked", do_display_hidden);
	});
	
	// settings confirm
	$(document).on("click", "#setting_confirm", function() {
		$("#setting").addClass("hidden");
		loading = "";
		search();
	});
	
	// return to top of page (anchor to top does not work as nav bar exists)
	$(document).on("click", "#nav_to_top", function() {
		$("html,body").animate({
			scrollTop: 0
		}, "fast");
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
		$("#search_display").html("");
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
	$(document).on("click", ".song_name_container", function(e) {
		if (!$(e.target).hasClass("song_copy_icon")) {
			var f = parseInt($(this).attr("id"));
			if(!hide_song.includes(f)){
				hide_song.push(f);
			}else{
				hide_song.splice(hide_song.indexOf(f), 1);
			}
			if (loading === "") {
				return;
			}
			$(".song_" + f).toggleClass("hidden");
			$("#fold_" + f).toggleClass("closed");
		}
	})

	// copy song info
	$(document).on("click", ".song_copy_icon", function() {
		var e = parseInt($(this).attr("id").replace("copy_name_", ""));
		navigator.clipboard.writeText(song[e][song_idx.name]);
	});
	
	// share
	$(document).on("click", ".entry_share", function() {
		var entry_id = parseInt($(this).attr("id").replace("entry_", ""));
		// get video title
		const url = "https://www.youtube.com/watch?v=" + video[entry[entry_id][entry_idx.video]][video_idx.id];

		fetch("https://noembed.com/embed?dataType=json&url=" + url)
			.then(res => res.json())
			.then(function(data) {
				// title of unlisted / private video are returned a 401 error
				if (data.title === undefined) {
					alert("再アップ/非公開の動画を共有しないで下さい。");
				} else {
					var tweet = song[entry[entry_id][entry_idx.song_id]][song_idx.name].trim() + " / " + song[entry[entry_id][entry_idx.song_id]][song_idx.artist] + " @" + data.title + "\n(youtu.be/" + video[entry[entry_id][entry_idx.video]][video_idx.id] + "?t=" + entry[entry_id][entry_idx.time] + ") via [site on work]";
					window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweet), "_blank");						
				}
		  });

	})
});

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
		$("#search_display").html("");
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
	// replace wchar w/ char
	e = e.normalize("NFKC");
	var f = new Array(200);
	var counter = 0;
	for (var i = 1; i < song.length; ++i) {
		if (searching_song_name) {
			if (series_name !== "") {
				if (song[i][song_idx.reading].includes(series_name) || song[i][song_idx.attr].includes(series_name)) {
					f[counter++] = i;
				}
			} else {
				if (song[i][song_idx.name].normalize("NFKC").toLowerCase().includes(e.toLowerCase()) ||
					song[i][song_idx.reading].toLowerCase().includes(e.toLowerCase())
				) {
					f[counter++] = i;
				}
			}
		} else {
			if (song[i][song_idx.artist].toLowerCase().includes(e.toLowerCase())) {
				f[counter++] = i;
			}
		}
		if (counter === 200) {
			break;
		}
	}
	hit_counter = 0;
	for (var i = 0; i < counter; ++i) {
		for (var j = 0; j < entry.length; ++j) {
			if (f[i] === entry[j][entry_idx.song_id]) {
				if ((!do_display_hidden) && is_private(j)) {
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
	$("#search_display").html("");
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
			if (!(sel_member & entry[hits[i]][entry_idx.type])) {
				continue;
			}
		}
		// if new song
		if (current_song !== entry[hits[i]][entry_idx.song_id]) {
			new_html += ((current_song !== -1 ? "</div>" : "") + "<div class=\"song_container\">");
			current_song = entry[hits[i]][entry_idx.song_id];
			loaded_song[loaded_count++] = current_song;
			// if hide the song
			var show = !hide_song.includes(current_song);
			// check song name
			var song_name = song[current_song][song_idx.name].normalize("NFKC");
			var song_name_length = 0;
			for (var j = 0; j < song_name.length; ++j) {
				song_name_length += /[ -~]/.test(song_name.charAt(j)) ? 1 : 2;
			}
			// you know what fuck this shit i will just add exception
			if (song_name === "secret base ~君がくれたもの~") {
				song_name_length = 0;
			}
			if (/([^~]+~+[^~])/g.test(song_name) && song_name_length >= 28) {
				song_name = song_name.substring(0, song_name.search(/~/g)) + "<br />" + song_name.substring(song_name.search(/~/g));
			}
			new_html += (
			"<div class=\"song_name_container " + (loaded_count % 2 === 0 ? "odd_colour" : "even_colour") + "\" id=\"" + current_song + "\">" +
				"<div class=\"song_rap\">" +
					"<div class=\"song_name\">" + song_name + "</div>" +
					(show ? ("<div class=\"song_credit" + (song[current_song][song_idx.artist].length > 30 ? " long_credit" : "") + " song_" + current_song + "\">" + song[current_song][song_idx.artist] + "</div>") : "") +
				"</div>" +
				"<div class=\"song_icon_container\">" +
					"<div id=\"fold_" + current_song + "\" class=\"song_fold_icon" + (show ? "" : " closed") + "\"></div>" +
					"<div id=\"copy_name_" + current_song + "\" class=\"song_copy_icon song_" + current_song + "\"></div>" +
				"</div>" +
			"</div>");
		}
		var is_mem = entry[hits[i]][entry_idx.note].includes("【メン限");
		var no_note = entry[hits[i]][entry_idx.note] === "" || entry[hits[i]][entry_idx.note] === "【メン限】" || entry[hits[i]][entry_idx.note] === "【メン限アーカイブ】";
		var note = entry[hits[i]][entry_idx.note];
		if (is_mem) {
			if (note.includes("メン限アーカイブ"))　{
				note = note.replace(/【メン限アーカイブ】/g, "");
			} else {
				note = note.replace(/【メン限】/g, "");
			}
		}
		new_html += ("<div class=\"entry_container singer_" + entry[hits[i]][entry_idx.type] + (is_mem ? "m" : "") + " song_" + current_song + (hide_song.includes(current_song) ? " hidden" : "") + "\"><a href=\"https://youtu.be/" + video[entry[hits[i]][entry_idx.video]][video_idx.id] + (entry[hits[i]][entry_idx.time] === 0 ? "" : ("?t=" + entry[hits[i]][entry_idx.time])) +"\" target=\"_blank\"><div class=\"entry_primary\"><div class=\"entry_date\">" + display_date(video[entry[hits[i]][entry_idx.video]][video_idx.date]) + "</div><div class=\"entry_singer\">" + singer_lookup[entry[hits[i]][entry_idx.type]] + "</div><div class=\"mem_display\">" + (is_mem ? "メン限" : "") + "</div><div class=\"entry_share\" id=\"entry_" + hits[i] + "\" onclick=\"return false;\"></div></div>" + (no_note ? "" : ("<div class=\"entry_note\">" + note + "</div>")) + "</a></div>");
	}
	$("#search_display").html(new_html + "</div>");
	// check all hiden songs
	for (var i = 0; i < hide_song.length; ++i) {
		// if song havnt been loaded, remove from hide list
		if (!loaded_song.includes(hide_song[i])) {
			hide_song.splice(i--, 1);
		}
	}
}

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

function is_private(index) {
	return entry[index][entry_idx.note].includes("非公開") || entry[index][entry_idx.note].includes("記録用") || entry[index][entry_idx.note].includes("アーカイブなし");
}

/*
 * to do
 * search bt attr mode
 * editing request list
 * copy to clip board
 * copied to clipboard message pop up
 *
 *
 *
 */