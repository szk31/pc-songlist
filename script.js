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
	"まどマギ" : ["まどマギ", "まどまぎ", "まどか"],
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

var version = "2023-01-09-3";

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

// prevent menu from opening when info or setting is up
var prevent_menu_popup = false;

// max display boxes of autocomplete
var auto_display_max;

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

// if the previous input should be cleared when user tap input box
var do_clear_input = false;

// if user prefer to text or picture selection
var use_singer_icon = true;

// if random requirement is ignored (input being blank)
var do_random_anyway = false;

// ram for searching (entry_processed)
var entry_proc = [];

$(document).ready(function() {
	$("#input").val("");
	// process data
	for (var i in song) {
		entry_proc[i] = [];
	}
	for (var i = 0; i < entry.length; ++i) {
		entry_proc[entry[i][0]].push(i);
	}
	$("#info_version").html(version);
	$("#info_last-update").html(video[video.length - 1][video_idx.date]);
	// get screen size
	auto_display_max = Math.floor(5 * Math.pow(window.innerHeight / window.innerWidth, 1.41421356237));
});

$(function() {
	{ // nav
		// nav - menu
		$(document).on("click", "#nav_menu", function(e) {
			// disable going back to top
			e.preventDefault();
			if (prevent_menu_popup) {
				return;
			}
			$("#menu_container").toggleClass("hidden");
			$("#nav_menu").toggleClass("menu_opened");
			$(document.body).toggleClass("no_scroll");
		});
		
		// nav - random
		$(document).on("click", "#nav_search_random", function() {
			if($(this).hasClass("disabled") && !do_random_anyway) {
				return;
			}
			// check if the song has any visibile record
			var random_song,
				found = trial = 0,
				sel_member = 7;
			for (var i in singer_chosen) {
				if (!singer_chosen[i]) {
					sel_member -= 1 << i;
				}
			}
			if (sel_member === 0) {
				// no body got selected so
				return;
			}
			do {
				random_song = Math.floor(Math.random() * song.length);
				for (var i in entry_proc[random_song]) {
					// check if all member
					if (sel_member !== 7) {
						if (!(sel_member & entry[entry_proc[random_song][i]][entry_idx.type])) {
							continue;
						}
					}
					if ((!do_display_hidden) && is_private(entry_proc[random_song][i])) {
						continue;
					}
					found++;
					break;
				}
			} while (found === 0);
			$("#input").val(song[random_song][song_idx.name]);
			search();
		});
		
		// nav - to_top
		$(document).on("click", "#nav_to_top", function(e) {
			e.preventDefault();
			if (prevent_menu_popup) {
				return;
			}
			$("html,body").animate({
				scrollTop: 0
			}, "fast");
		});
	}
	
	{ // menu
		// menu -fog> return
		$(document).on("click", "#menu_container", function(e) {
			if (!($(e.target).parents(".defog").length || $(e.target).hasClass("defog"))) {
				$("#menu_container").addClass("hidden");
				$("#nav_menu").removeClass("menu_opened");
				$(document.body).removeClass("no_scroll");
			}
		});
		
		// menu -> page
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
				$(document.body).removeClass("no_scroll");
			}
		});
		
		// menu - information
		$(document).on("click", "#menu_info", function() {
			$("#popup_container").removeClass("hidden");
			$("#information").removeClass("hidden");
			$("#menu_container").addClass("hidden");
			$("#nav_menu").removeClass("menu_opened");
			prevent_menu_popup = true;
		});
		
		// menu - settings
		$(document).on("click", "#menu_setting", function() {
			$("#popup_container").removeClass("hidden");
			$("#setting").removeClass("hidden");
			$("#menu_container").addClass("hidden");
			$("#nav_menu").removeClass("menu_opened");
			prevent_menu_popup = true;
			// change name<->icon position according to if scrollbar is present
			// this thing doesnt really work but also very not likely to be even triggered so anyways
			if ($("#setting_defog").get(0).scrollHeight > $("#setting_defog").height()) {
				$("#setting_singer_display").addClass("scrollbar_present");
			}
		});
	}

	// information -fog> return
	$(document).on("click", "#information", function(e) {
		if (!($(e.target).parents(".defog").length ||  $(e.target).hasClass("defog"))) {
			$("#information").addClass("hidden");
			$("#popup_container").addClass("hidden");
			$(document.body).removeClass("no_scroll");
			prevent_menu_popup = false;
		}
	});
	
	{ // setting
		// setting - 0 : display maximum
		$(document).on("input", "#setting_max-display_value", function() {
			var e = $("#setting_max-display_value").val();
			
			// remove anything thats not 0~9
			e = e.replace(/[^\d]/g, "");
			
			// check if e is blank (after replace)
			if (e === "") {
				$("#setting_max-display_value").val(e);
				return;
			}
			
			// check min max
			e = Math.min(400, Math.max(1, parseInt(e)));
			$("#setting_max-display_value").val(e);
		});
		
		// setting - 1 : do diplay hidden switch update
		$(document).on("change", "#setting_display-private_checkbox", function(e) {
			do_display_hidden = e.target.checked;
		});
		
		// setting - 2 : reset input
		$(document).on("change", "#setting_reset-input_checkbox", function(e) {
			do_clear_input = e.target.checked;
		});
		
		// setting - 3 : singer selection
		$(document).on("change", "#setting_singer_checkbox", function(e) {
			use_singer_icon = e.target.checked;
			$("#setting_singer_display").html(use_singer_icon ? "アイコン" : "　名前　");
		});
		
		// setting - 4 : ignore random requirement
		$(document).on("change", "#setting_random_checkbox", function(e) {
			do_random_anyway = e.target.checked;
		});
		
		// setting - 90 : reset to default
		$(document).on("click", "#setting_default", function(e) {
			// prevent going back to top
			e.preventDefault();
			// revert value
			max_display = 100;
			do_display_hidden = false;
			do_clear_input = false;
			use_singer_icon = true;
			do_random_anyway = false;
			
			// update display
			$("#setting_max-display_value").val(max_display);
			$("#setting_display-private_checkbox").prop("checked", do_display_hidden);
			$("#setting_reset-input_checkbox").prop("checked", do_clear_input);
			$("#setting_singer_checkbox").prop("checked", use_singer_icon);
			$("#setting_singer_display").html(use_singer_icon ? "アイコン" : "　名前　");
			$("#setting_random_checkbox").prop("checked", do_random_anyway);
		});
		
		// setting - 91 : confirm
		$(document).on("click", "#setting_confirm", function(e) {
			// prevent going back to top
			e.preventDefault();
			$("#setting").addClass("hidden");
			$("#popup_container").addClass("hidden");
			$(document.body).removeClass("no_scroll");
			prevent_menu_popup = false;
			// assign values (those are not changed on edit)
			max_display = parseInt($("#setting_max-display_value").val());
			if (use_singer_icon) {
				$(".singer_container").addClass("hidden");
				$(".singer_icon_container").removeClass("hidden");
			} else {
				$(".singer_container").removeClass("hidden");
				$(".singer_icon_container").addClass("hidden");
			}
			if (do_random_anyway) {
				$("#nav_search_random").removeClass("disabled");
			} else {
				if ($("#input").val() === "") {
					$("#nav_search_random").removeClass("disabled");
				} else {
					$("#nav_search_random").addClass("disabled");
				}
			}
			loading = "";
			search();
		});
	}

	{ // search
		// search - input - autocomplete
		$(document).on("input", "#input", function() {
			auto_search();
		});
		
		// search - input::focus
		$(document).on("focus", "#input", function() {
			auto_search();
		});

		// search - input - autocomplete - selection
		$(document).on("mousedown", ".auto_panel", function() {
			var e = $(this).attr("id");
			// set input
			$("#input").val(e);
			// input on blur fires after this so no need to run search here
		});

		// search - input - submit
		$(document).on("blur", "#input", function() {
			$("#search_auto").addClass("hidden");
			search();
		});
		
		// search - input::enter -> blur
		$(document).on("keydown", function(e) {
			if (e.keyCode === 13) {
				$("#input").blur();
			}
		});
		
		// search - input::on_click -> reset
		$(document).on("focus", "#input", function(e) {
			if (do_clear_input) {
				$(e.target).val("");
				$("#nav_search_random").removeClass("disabled");
			}
		});
		
		// search - switch
		$(document).on("click", "#switch_method", function() {
			$("#input").val("");
			searching_song_name ^= 1;
			$("#input").attr("placeholder", searching_song_name ? "曲名/読みで検索" : "アーティスト名で検索");
			$("#search_display").html("");
			loading = "";
			$("#input").focus();
		});
		
		// search - singer - name
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
		
		// search - singer - icon
		$(document).on("click", ".singer_icon", function() {
			var e = $(this).attr("id");
			var selected = -1;
			switch (e) {
				case "icon_kirara":
					selected = 2;
					break;
				case "icon_momo":
					selected = 1;
					break;
				case "icon_nia":
					selected = 0;
					break;
			}
			singer_chosen[selected] ^= 1;
			$(".sing_sel_" + selected).toggleClass("selected");
			loading = "";
			search();
		})
		
		// search - song - hide_song
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
		});

		// search - song - copy_name
		$(document).on("click", ".song_copy_icon", function() {
			var e = parseInt($(this).attr("id").replace("copy_name_", ""));
			navigator.clipboard.writeText(song[e][song_idx.name]);
		});
		
		// search - entry - share
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
		});
	}

});

var hits = new Array();
var hit_counter = 0;

function auto_search() {
	var e = $("#input").val().toLowerCase();
	if (e === "") {
		$("#search_auto").addClass("hidden");
		return;
	}
	var auto_exact = [],
		auto_other = [],
		auto_exact_count = 0,
		auto_other_count = 0;
	// search for series name
	for (var i in series_lookup) {
		for (var j in series_lookup[i]) {
			var f = series_lookup[i][j].indexOf(e);
			if (f !== -1) {
				// if string exist in series variations
				auto_exact[auto_exact_count++] = i;
				break;
			}
		}
	}
	// if input consist of only hiragana, "ー" or "ヴ"
	if (!/[^\u3040-\u309F\u30FC\u30F4]/.test(e) && searching_song_name) {
		// search for reading
		// should search for index of 1st char -> 2nd then try to fill up auto_exact first but who cares about loading time anyway
		for (var i = 1; i < song.length; ++i) {
			// skip if same song name
			if (i > 2 && song[i][song_idx.name].trim() === song[i - 1][song_idx.name].trim()) {
				continue;
			}
			var f = song[i][song_idx.reading].indexOf(e);
			switch (f) {
				case  0 : // found, from beginning
					if (entry_proc[i].length > 0) {
						auto_exact[auto_exact_count++] = i;
					}
					break;
				case -1 : // not found
					break;
				default : // found, not from beginning
					if (entry_proc[i].length > 0) {
						auto_other[auto_other_count++] = i;
					}
					break;
			}
			if (auto_exact_count >= auto_display_max) {
				break;
			}
		}
	} else if (searching_song_name) {
		// search for song name
		for (var i = 1; i < song.length; ++i) {
			// skip if same song name
			if (i > 2 && song[i][song_idx.name].trim() === song[i - 1][song_idx.name].trim()) {
				continue;
			}
			var f = song[i][song_idx.name].toLowerCase().indexOf(e);
			switch (f) {
				case  0 : // found, from beginning
					if (entry_proc[i].length > 0) {
						auto_exact[auto_exact_count++] = i;
					}
					break;
				case -1 : // not found
					break;
				default : // found, not from beginning
					if (entry_proc[i].length > 0) {
						auto_other[auto_other_count++] = i;
					}
					break;
			}
			if (auto_exact_count >= auto_display_max) {
				break;
			}
		}
	} else {
		// search for artist
		// not implemented for now, or maybe forever
	}
	// display
	var auto_display_count = 0;
	var new_html = "";
	for (var i in auto_exact) {
		// data being number (song id) or string (series name)
		var auto_reading, auto_display, song_name;
		if (isNaN(parseInt(auto_exact[i]))) {
			// series name
			auto_reading = "";
			auto_display = song_name = auto_exact[i];
		} else {
			// song reading
			var song_reading = song[auto_exact[i]][song_idx.reading];
			if (song_reading.indexOf(" ") === -1) {
				auto_reading = bold(song_reading, e)
			} else {
				auto_reading = bold(song_reading.substring(0, song_reading.indexOf(" ")), e);
			}
			// song name
			song_name = song[auto_exact[i]][song_idx.name];
			auto_display = bold(song_name, e);
		}
		new_html += ("<div id=\"" + song_name + "\" class=\"auto_panel" + (auto_display_count === 0 ? " auto_first" : "") + "\"><div class=\"auto_reading\">" + auto_reading + "</div><div class=\"auto_display\">" + auto_display + "</div></div>");
		auto_display_count++;
	}
	for (var i in auto_other) {
		new_html += ("<div id=\"" + song[auto_other[i]][song_idx.name] + "\" class=\"auto_panel" + (auto_display_count === 0 ? " auto_first" : "") + "\"><div class=\"auto_reading\"></div><div class=\"auto_display\">" + bold(song[auto_other[i]][song_idx.name], e) + "</div></div>");
		
		if (++auto_display_count >= auto_display_max) {
			break;
		}
	}
	$("#search_auto").html(new_html);
	if (new_html !== "") {
		$("#search_auto").removeClass("hidden");
	} else {
		$("#search_auto").addClass("hidden");
	}
}

function search() {
	var e = $("#input").val();
	if (e === loading) {
		return;
	}
	loading = e;
	if (e === "") {
		// clear current list
		$("#search_display").html("");
		// enable random
		$("#nav_search_random").removeClass("disabled");
		return;
	}
	// not empty input
	// disable random
	if (!do_random_anyway) {
		$("#nav_search_random").addClass("disabled");
	}
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
	// sort exact song name to top
	f.sort(function (a, b) {
		if (song[a][song_idx.name].trim().toLowerCase() === e.toLowerCase()) {
			// exist a record same to input
			if (song[b][song_idx.name].trim().toLowerCase() === e.toLowerCase()) {
				// if the other record is also same to input
				return 0;
			} else {
				return -1;
			}
		} else {
			if (song[b][song_idx.name].trim().toLowerCase() === e.toLowerCase()) {
				return 1;
			}
		}
	});
	hit_counter = 0;
	for (var i = 0; i < counter; ++i) {
		for (var j in entry_proc[f[i]]) {
			if ((!do_display_hidden) && is_private(j)) {
				continue;
			}
			hits[hit_counter++] = entry_proc[f[i]][j];
		}
	}
	update_display();
}

function update_display() {
	$("#search_auto").addClass("hidden");
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
	var displayed = 0;
	for (var i = 0; i < hit_counter; ++i) {
		// check if all member
		if (sel_member !== 7) {
			if (!(sel_member & entry[hits[i]][entry_idx.type])) {
				continue;
			}
		}
		// skip if private
		if ((!do_display_hidden) && is_private(hits[i])) {
			continue;
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
			// case "みくみくにしてあげる♪【してやんよ】"
			if (song_name === "みくみくにしてあげる♪【してやんよ】") {
				song_name = "みくみくにしてあげる♪<br />【してやんよ】";
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
		if (++displayed >= max_display) {
			break;
		}
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

function bold(org, selc) {
	var e = org.toLowerCase().indexOf(selc.toLowerCase());
	if (e === -1 || selc === "") {
		return org;
	} else {
		return (org.substring(0, e) + "<b>" + org.substring(e, e + selc.length) + "</b>" + org.substring(e + selc.length));
	}
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