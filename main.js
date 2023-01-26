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

// (not used)
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
	"アイマス" : ["アイマス", "あいます", "デレマス", "でれます"],
	"ジブリ" : ["ジブリ", "じぶり"],
	"物語シリーズ" : ["物語シリーズ", "ものがたりしりーず", "ものがたりシリーズ"],
	"まどマギ" : ["まどマギ", "まどまぎ", "まどか"],
};

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
	attr : 3,
	release : 4
};
var video_idx = {
	id : 0,
	date : 1
};

var version = "1.0.1";

/* control / memories */

// prevent menu from opening when info or setting is up
var prevent_menu_popup = false;

// current page name
var current_page = "search";


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
	if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)){
		// on mobile, do nothing
	} else {
		// check screen ratio
		// and hope nobody use some super-duper long screen
		if (window.innerHeight / window.innerWidth < 1.3) {
			// bad screen ratio, open new window
			$("#v_screen").addClass("post_switch");
			$("#v_screen").height("100%");
			$("#v_screen").width(0.5625 * window.innerHeight);
			$("#v_screen").attr("src", "index.html");
			// hide original page
			$("body > div").addClass("post_switch");
			$("body").addClass("post_switch");
			return;
		}
	}
	init();
});

$(function() {
	// revert pop-up
	$(document).on("click", "#popup_remnant", function() {
		$("body > div").removeClass("post_popup");
		init();
	});
	
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
			if (prevent_menu_popup) {
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
			if (target !== current_page) {
				current_page = target;
				$(".menu2page_selected").removeClass("menu2page_selected");
				$("#" + $(e.target).attr("id")).addClass("menu2page_selected");
				
				// show / hide section
				$(".section_container").addClass("hidden");
				switch (target) {
					case "search" :
						// show section
						$("#search_section").removeClass("hidden");
						$("#nav_search_random").removeClass("hidden");
						$("#nav_share_rep").addClass("hidden");
						$("#nav_title").html("曲検索");
						// reset input -> reload
						$("#input").val("");
						search();
						break;
					case "repertoire" : 
						// show section
						$("#repertoire_section").removeClass("hidden");
						$("#nav_search_random").addClass("hidden");
						$("#nav_share_rep").removeClass("hidden");
						$("#nav_title").html("レパートリー");
						// do whatever needed
						$(window).scrollTop(0);
						rep_search();
						break;
				}
				
				// close menu
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
		
		// setting - 0 - blur input
		$(document).on("keydown", function(e) {
			if (e.keyCode === 13) {
				$("#setting_max-display_value").blur();
			}
		})
		
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
});

function init() {
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
	
	// rep
	// get each member's repertoire
	for (var i = 0; i < song.length; ++i) {
		rep_list[i] = 0
		for (var j in entry_proc[i]) {
			// check if all singer bits are filled
			if ((rep_list[i] & 7) === 7) {
				break;
			}
			// or is faster than checking then add (i think)
			rep_list[i] |= entry[entry_proc[i][j]][entry_idx.type];
		}
		// remove the non-singer bit, not needed.
		rep_list[i] &= ~8;
	}
}

// functional functions

// display date in yyyy-MM-dd format
function display_date(input) {
	var e = typeof(input) === "string" ? new Date(input) : input;
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

function get_last_sang(id, mask = 7) {
	for (var i = entry_proc[id].length - 1; i >= 0; --i) {
		if (mask & entry[entry_proc[id][i]][entry_idx.type]) {
			return new Date(video[entry[entry_proc[id][i]][entry_idx.video]][video_idx.date]);
		}
	}
	// not found;
	return 0;
}

// returns a date object for a "dd-mm-yyyy" input
function to8601(date_string) {
	return new Date(
		date_string.substring(6),
		parseInt(date_string.substring(3, 5)) - 1,
		date_string.substring(0, 2)
	);
}

// get day different between {date1 and date2} or {date1 and today}
function get_date_different(date1, date2) {
	date1 = (typeof(date1) === "string") ? new Date(date1) : date1;
	date2 = date2 === undefined ? new Date() : new Date(date2);
	return Math.floor(Math.abs(date1.getTime() - date2.getTime()) / 86400000) + 1;
}

// get entry count of all entry and member-only entry that fufills mask
function get_sang_count(id, mask = 7) {
	var count = 0,
		mem_count = 0;
	for (var i in entry_proc[id]) {
		if (entry[entry_proc[id][i]][entry_idx.type] & mask) {
			count++;
			if (entry[entry_proc[id][i]][entry_idx.note].includes("【メン限")) {
				mem_count++;
			}
		}
	}
	return [count, mem_count];
}

function get_attr(id) {
	var e = entry[id][entry_idx.note];
	if (e.includes("ASMR弾き語り")) {
		return "asm";
	}
	if (e.includes("弾き語り")) {
		return "gui";
	}
	if (e.includes("アカペラ")) {
		return "aca";
	}
	return "oke";
}

/*
 * to do
 * search by attr mode
 * editing request list
 * copy to clip board
 * copied to clipboard message pop up
 *
 *
 *
 */