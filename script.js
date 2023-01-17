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

// attr lookup
var attr_idx = [
	"others",
	"アニソン",
	"ラブライブ",
	"アイマス",
	"マクロス",
	"J-POP",
	"ボカロ",
	"ジブリ",
	"特撮",
	"ロック",
	"歌謡曲",
	"ポップス",
	"R&B",
	"キャラソン"
];

var version = "2023-01-17-3";

/* control / memories */
// stores whats currently looking up
var loading = "";

// stores enabled singer data
var singer_chosen = [1, 1, 1];

// store song id (song[id]) of folded up songs
var hide_song = new Array();

// if searching through song names or artist names
var searching_song_name = true;

// prevent menu from opening when info or setting is up
var prevent_menu_popup = false;

// max display boxes of autocomplete
var auto_display_max;

// current page name
var current_page = "search";


// repertoire section
// type of all songs
var rep_list = [];
// singer selection
var rep_singer = [1, 1, 1];
// singer selection method
var rep_is_union = true;
// attribute selection
var rep_attr = {
	oke : 1,
	aca : 1,
	gui : 1,
	asm : 1
};
// anisong selection
var rep_anisong = {
	lovelive : [1, 2],
	imas : [1, 3],
	macros : [1, 4],
	other : [1, 1]
};
// genre selection
var rep_genre = {
	jpop : [1, 5],
	voc : [1, 6],
	jib : [1, 7],
	tok : [1, 8],
	rock : [1, 9],
	kay : [1, 10],
	pops : [1, 11],
	rnb : [1, 12],
	cha : [1, 13],
	other : [1, 0]
};
// sort method
var rep_sort = "50";
// sort order
var rep_sort_asd = true;
// display info
var rep_info = "none";
// editing list - selected song
var rep_edit_selected = -1;
/* rep_edit_selected :
 * -2 : edit mode, nothing selected
 * -1 : not-edit mode
 * 0~ : index of the song in rep_selected
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

	{ // repertoire
		// filter - hide_block
		$(document).on("click", ".filter_title", function() {
			var e = $(this).attr("id").replace(/(filter_)|(_title)/g, "");
			$("#filter_" + e + "_close").toggleClass("closed");
			$("#filter_" + e + "_content").toggleClass("hidden");
		});
		
		// filter - entry - singer
		$(document).on("click", ".filter_icon", function() {
			var e = $(this).attr("id").replace(/(filter_)|(_icon)/g, "");
			var f = -1;
			switch (e) {
				case "kirara" :
					f = 2;
					break;
				case "momo" :
					f = 1;
					break;
				case "nia" :
					f = 0;
					break;
				default : 
					//error
					return;
			}
			rep_singer[f] ^= 1;
			$(this).toggleClass("selected");
			rep_search();
		});
		
		// filter - singer - inter
		$(document).on("click", ".filter_singer_group", function() {
			var e = $(this).attr("id").replace(/(filter_icon_)/, "");
			if ((e === "union") === rep_is_union) {
				return;
			}
			rep_is_union ^= 1;
			$(".singer_checkbox").removeClass("selected");
			$("#singer_" + e).addClass("selected");
			rep_search();
		});
		
		// filter - entry - attr
		$(document).on("click", ".filter_entry_attr_item", function() {
			var e = $(this).attr("id").replace(/(attr_container_)/, "");
			if (e === "all") {
				// if selecting all
				// check if it is previously selected
				$(".attr_checkbox").toggleClass("selected", !$("#attr_" + e).hasClass("selected"));
				for (var i in rep_attr) {
					rep_attr[i] = $("#attr_" + e).hasClass("selected") ? 1 : 0;
				}
			} else {
				$("#attr_" + e).toggleClass("selected");
				rep_attr[e] ^= 1;
				if (!$("#attr_" + e).hasClass("selected")) {
					$("#attr_all").removeClass("selected");
				} else {
					for (var i in rep_attr) {
						if (!rep_attr[i]) {
							rep_search();
							return;
						}
					}
					$("#attr_all").addClass("selected");
				}
			}
			rep_search();
		});
		
		// filter - genre - anisong
		$(document).on("click", ".filter_genre_anisong_item", function() {
			var e = $(this).attr("id").replace(/(genre_container_anisong_)/, "");
			if (e === "all") {
				$(".genre_anisong_checkbox").toggleClass("selected", !$("#anisong_all").hasClass("selected"));
				for (var i in rep_anisong) {
					rep_anisong[i][0] = $("#anisong_all").hasClass("selected") ? 1 : 0;
				}
			} else {
				$("#anisong_" + e).toggleClass("selected");
				rep_anisong[e][0] ^= 1;
				if (!$("#anisong_" + e).hasClass("selected")) {
					$("#anisong_all").removeClass("selected");
				} else {
					for (var i in rep_anisong) {
						if (!rep_anisong[i][0]) {
							rep_search();
							return;
						}
					}
					$("#anisong_all").addClass("selected");
				}
			}
			rep_search();
		});
		
		// filter - genre - general
		$(document).on("click", ".filter_genre_general_item", function() {
			var e = $(this).attr("id").replace(/(genre_container_general_)/, "");
			if (e === "all") {
				$(".genre_general_checkbox").toggleClass("selected", !$("#general_all").hasClass("selected"));
				for (var i in rep_genre) {
					rep_genre[i][0] = $("#general_all").hasClass("selected") ? 1 : 0;
				}
			} else {
				$("#general_" + e).toggleClass("selected");
				rep_genre[e][0] ^= 1;
				if (!$("#general_" + e).hasClass("selected")) {
					$("#general_all").removeClass("selected");
				} else {
					for (var i in rep_genre) {
						if (!rep_genre[i][0]) {
							rep_search();
							return;
						}
					}
					$("#general_all").addClass("selected");
				}
			}
			rep_search();
		});
		
		// filter - sort - item
		$(document).on("click", ".filter_sort_item", function() {
			var e = $(this).attr("id").replace(/(sort_container_)/, "");
			// check if clicking on the same item
			if (rep_sort === e) {
				return;
			}
			// update asd, des text
			switch (e) {
				case "50" : 
					$("#sort_name_asd").html("正順");
					$("#sort_name_des").html("逆順");
					break;
				case "count" : 
					$("#sort_name_asd").html("多い順");
					$("#sort_name_des").html("少ない順");
					break;
				case "date" : 
				case "release" : 
					$("#sort_name_asd").html("新しい順");
					$("#sort_name_des").html("古い順");
					break;
			}
			$(".sort_checkbox").removeClass("selected");
			$("#sort_" + e).addClass("selected");
			rep_sort = e;
			rep_display();
		});
		
		// filter - sort - asd
		$(document).on("click", ".filter_sort2_item", function() {
			var e = $(this).attr("id").replace(/(sort_container_)/, "");
			// check if clicking on the same item
			if (rep_sort_asd === (e === "asd")) {
				return;
			}
			$(".sort2_checkbox").removeClass("selected");
			$("#sort_" + e).addClass("selected");
			rep_sort_asd = (e === "asd");
			rep_display();
		});
		
		// filter - display
		$(document).on("click", ".filter_display_item", function() {
			var e = $(this).attr("id").replace(/(display_container_)/, "");
			// check if clicking on the same item
			if (rep_info === e) {
				return;
			}
			$(".display_checkbox").removeClass("selected");
			$("#display_" + e).addClass("selected");
			rep_info = e;
			rep_display();
		});
		
		// display - select
		$(document).on("click", ".rep_song_container", function() {
			var e = parseInt($(this).attr("id").replace(/(rep_song_)/, ""));
			if ($(this).hasClass("selected")) {
				rep_selected.splice(rep_selected.indexOf(e), 1);
				if (rep_selected.length === 0) {
					$("#nav_share_rep").addClass("disabled");
				}
			} else {
				rep_selected.push(e);
				$("#nav_share_rep").removeClass("disabled");
			}
			$(this).toggleClass("selected");
		});
		
		// display  - share
		$(document).on("click", "#nav_share_rep", function(e) {
			e.preventDefault();
			if ($(this).hasClass("disabled") || prevent_menu_popup) {
				return;
			}
			// disable menu, other buttons
			prevent_menu_popup = true;
			$(document.body).toggleClass("no_scroll");
			$("#rep_list").removeClass("hidden");
			$("#popup_container").removeClass("hidden");
			
			rep_update_list();
		});
		
		// display - toggle artist
		$(document).on("click", "#rep_list_artist", function() {
			if ($("#rep_list_artist").hasClass("disabled")) {
				return;
			}
			$("#list_artist_cb").toggleClass("selected");
			rep_update_list();
		});
		
		// display - edit - toggle
		$(document).on("click", "#rep_list_edit", function() {
			// if back from deleting the last song
			if (rep_selected.length === 0) {
				return;
			}
			// if in edit mode
			if (rep_edit_selected === -1) {
				// not in edit mode
				$("#rep_list_edit").html("編集終了");
				$("#rep_list_artist").addClass("disabled");
				$("#rep_list_close").addClass("disabled");
				$("#rep_compose_tweet").addClass("disabled");
				$("#rep_list_leftbar").removeClass("hidden");
				$("#rep_list_container").addClass("editing");
				rep_edit_selected = -2;
				// reset all edit buttons
				rep_update_leftbar();
			} else {
				// was in edit mode
				$("#rep_list_edit").html("編集");
				$("#rep_list_artist").removeClass("disabled");
				$("#rep_list_close").removeClass("disabled");
				$("#rep_compose_tweet").removeClass("disabled");
				$("#rep_list_leftbar").addClass("hidden");
				$("#rep_list_container").removeClass("editing");
				rep_edit_selected = -1;
			}
		});
		
		// display - edit - select
		$(document).on("click", ".rep_list_item", function() {
			var e = parseInt($(this).attr("id").replace(/(rep_btn_)/, ""));
			switch (rep_edit_selected) {
				case -1 : // not in edit mode
					return;
					break;
				case -2 : // no item selected
					rep_edit_selected = e;
					// change button
					rep_update_leftbar();
					break;
				case e : // current selected
					rep_edit_selected = -2;
					// reset button
					rep_update_leftbar();
					break;
				default : // others
					if ($(this).hasClass("arrow_up")) {
						[rep_selected[e], rep_selected[e + 1]] = [rep_selected[e + 1], rep_selected[e]];
						rep_edit_selected--;
						rep_update_list();
						rep_update_leftbar();
						// check for off-screen element
						var target_id = Math.max(0, rep_edit_selected - 1);
						var div_top = $("#rep_list_leftbar").offset().top,
						   node_top = $("#rep_btn_" + target_id).offset().top;
						if (node_top < div_top) {
							$("#rep_list_leftbar").scrollTop($("#rep_list_leftbar").scrollTop() - div_top + node_top);
							$("#rep_list_content").scrollTop($("#rep_list_leftbar").scrollTop());
						}
					}
					if ($(this).hasClass("arrow_down")) {
						[rep_selected[e - 1], rep_selected[e]] = [rep_selected[e], rep_selected[e - 1]];
						rep_edit_selected++;
						rep_update_list();
						rep_update_leftbar();
						// check for off-screen element
						var target_id = Math.min(rep_edit_selected + 1, rep_selected.length - 1);
						var div_btm = $("#rep_list_leftbar").offset().top + $("#rep_list_leftbar").height(),
						   node_btm = $("#rep_btn_" + target_id).offset().top + $("#rep_btn_" + target_id).height();
						if (node_btm > div_btm) {
							$("#rep_list_leftbar").scrollTop($("#rep_list_leftbar").scrollTop() - div_btm + node_btm);
							$("#rep_list_content").scrollTop($("#rep_list_leftbar").scrollTop());
						}
					}
					break;
			}
		});
		
		// display - edit - delete
		$(document).on("click", ".rep_list_delete", function() {
			if (rep_edit_selected >= 0) {
				// remove selected class from display
				$("#rep_song_" + rep_selected[rep_edit_selected]).removeClass("selected");
				rep_selected.splice(rep_edit_selected, 1);
			}
			rep_edit_selected = -2;
			rep_update_list();
			rep_update_leftbar();
			if (rep_selected.length === 0) {
				// quit edit mode
				$("#rep_list_edit").html("編集");
				$("#rep_list_artist").removeClass("disabled");
				$("#rep_list_close").removeClass("disabled");
				$("#rep_compose_tweet").removeClass("disabled");
				$("#rep_list_leftbar").addClass("hidden");
				$("#rep_list_container").removeClass("editing");
				rep_edit_selected = -1;
				$("#nav_share_rep").addClass("disabled");
			}
		});
		
		// display - edit - sync scroll
		$("#rep_list_content").on("scroll", function() {
			$("#rep_list_leftbar").scrollTop($("#rep_list_content").scrollTop());
		});
		
		// display - close
		$(document).on("click", "#rep_list_close", function() {
			if ($("#rep_list_close").hasClass("disabled")) {
				return;
			}
			prevent_menu_popup = false;
			$("#rep_list").addClass("hidden");
			$("#popup_container").addClass("hidden");
			$(document.body).toggleClass("no_scroll");
		});
		
		// display - tweet
		$(document).on("click", "#rep_compose_tweet", function() {
			if ($("#rep_compose_tweet").hasClass("disabled")) {
				return;
			}
			if (rep_selected.length === 0) {
				return;
			}
			prevent_menu_popup = false;
			$("#rep_list").addClass("hidden");
			$("#popup_container").addClass("hidden");
			$(document.body).toggleClass("no_scroll");
			// ignore character limit and tweet anyway
			var tweet = "";
			for (var i in rep_selected) {
				tweet += (song[rep_selected[i]][song_idx.name] + ($("#list_artist_cb").hasClass("selected") ? (" / " + song[rep_selected[i]][song_idx.artist]) : "") + "\n");
			}
			window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(tweet), "_blank");
		});
	}
});

var hits = [];
var hit_counter = 0;

function auto_search() {
	var e = $("#input").val().normalize("NFKC").toLowerCase();
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
	// replace wchar w/ char
	e = e.normalize("NFKC");
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
	// search for series in attr
	var attr_series = 0;
	if (series_name != "") {
		var using_attr = [2, 3, 4, 7];
		for (var i in using_attr) {
			if (attr_idx[using_attr[i]] === series_name) {
				attr_series = using_attr[i];
				break;
			}
		}
	}

	var f = new Array(200);
	var counter = 0;
	for (var i = 1; i < song.length; ++i) {
		if (counter === 200) {
			break;
		}
		if (searching_song_name) {
			if (series_name !== "") {
				if (song[i][song_idx.reading].includes(series_name)) {
					f[counter++] = i;
					continue;
				}
				// check in attr index
				if (attr_series) {	// default 0 if not needed
					if ((1 << attr_series) & song[i][song_idx.attr]) {
						f[counter++] = i;
					}
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

var rep_hits = [];
var rep_hits_count = 0;

var rep_selected = [];

function rep_search() {
	// all singer pre-load
	var selected_member = 0;
	for (var i in rep_singer) {
		selected_member += rep_singer[i] << i;
	}
	if (selected_member === 0) {
		// clear output
		$("#rep_display").html("");
		return;
	}
	// get mask
	var mask = 0;
	rep_hits = [];
	rep_hits_count = 0;
	for (var i in rep_anisong) {
		mask += rep_anisong[i][0] << rep_anisong[i][1];
	}
	for (var i in rep_genre) {
		mask += rep_genre[i][0] << rep_genre[i][1];
	}
	// remove flag
	var inv_mask = 0;
	for (var i in rep_anisong) {
		if (i === "other") {
			continue;
		}
		inv_mask += (1 - rep_anisong[i][0]) << rep_anisong[i][1];
	}
	// search
	for (var i = 0; i < song.length; ++i) {
		if (song[i][song_idx.attr] & mask) {
			if (inv_mask != 0) {
				// remove song thats deselected
				if ((song[i][song_idx.attr] & inv_mask)) {
					continue;
				}
			}
			// check singer requirement
			if (rep_is_union ? !(selected_member & rep_list[i]) : (selected_member !== rep_list[i])) {
				continue;
			}
			rep_hits[rep_hits_count++] = i;
		}
	}
	rep_display();
}

function rep_display() {
	// get member
	$("#rep_display").html("");
	var selected_member = 0;
	for (var i in rep_singer) {
		selected_member += rep_singer[i] << i;
	}
	// sort record
	switch (rep_sort) {
		case "50" :
			// default, do nothing
			rep_hits.sort((a, b) => {
				return a - b;
			});
			if (!rep_sort_asd) {
				rep_hits.reverse();
			}
			break;
		case "count" :
			// sang entry count
			rep_hits.sort((a, b) => {
				if (entry_proc[b].length === entry_proc[a].length) {
					return 0;
				}
				return (rep_sort_asd ? 1 : -1) * (entry_proc[b].length - entry_proc[a].length);
			});
			break;
		case "date" :
			// sort with last sang date
			rep_hits.sort((a, b) => {
				if (get_last_sang(b, selected_member).getTime() === get_last_sang(a, selected_member).getTime()) {
					return 0;
				}
				return (rep_sort_asd ? 1 : -1) * (get_last_sang(b, selected_member).getTime() - get_last_sang(a, selected_member).getTime());
			});
			break;
		case "release" :
			// release date of song
			rep_hits.sort((a, b) => {
				if (song[b][song_idx.release] === song[a][song_idx.release]) {
					return 0;
				}
				return (rep_sort_asd ? 1 : -1) * (to8601(song[b][song_idx.release]).getTime() - to8601(song[a][song_idx.release]).getTime());
			});
			break;
		default : 
			// anything else is error
			console.log("rep_sort of type \"" + rep_sort + "\" not found");
			return;
	}
	//console.log(rep_hits);
	// actual displaying
	for (var i = 0; i < rep_hits.length; ++i) {
		// sang count
		var sang_count = get_sang_count(rep_hits[i], selected_member);
		// container div
		var new_html = "<div class=\"rep_song_container" + (rep_selected.includes(i) ? " selected" : "") + (sang_count[0] === sang_count[1] ? " rep_mem_only" : "") + "\" id=\"rep_song_" + rep_hits[i] + "\">";
		// title
		new_html += ("<div class=\"rep_song_title\">" + song[rep_hits[i]][song_idx.name] + " / " + song[rep_hits[i]][song_idx.artist] + "</div>");
		// info line1
		new_html += "<div class=\"rep_song_info grid_block-4\">";
		// last sang
		new_html += ("<div>" + get_date_different(get_last_sang(rep_hits[i], selected_member)) + "日前</div>");
		// count
		new_html += ("<div>" + sang_count[0] + "回" + (sang_count[1] > 0 ? (sang_count[0] === sang_count[1] ? " (メン限のみ)" : " (" + sang_count[1] + "回メン限)") : "") + "</div>");
		// type
		new_html += ("<div class=\"grid_block-3\"><div class=\"" + (rep_list[rep_hits[i]] & 4 ? "rep_song_kirara" : "rep_song_empty") + "\"></div><div class=\"" + (rep_list[rep_hits[i]] & 2 ? "rep_song_momo" : "rep_song_empty") + "\"></div><div class=\"" + (rep_list[rep_hits[i]] & 1 ? "rep_song_nia" : "rep_song_empty") + "\"></div></div>");
		// extra info
		switch (rep_info) {
			case "release" : 
				new_html += ("<div class=\"rep_extra_info\"> (" + display_date(to8601(song[rep_hits[i]][song_idx.release])) + ")</div>");
				break;
			case "attrdata" : 
				var attr_count = {asm : 0, gui : 0, aca : 0};
				for (var j in entry_proc[rep_hits[i]]) {
					// only get attr if the entry satisfy selected singer
					if (entry[entry_proc[rep_hits[i]][j]][entry_idx.type] & selected_member) {
						attr_count[get_attr(entry_proc[rep_hits[i]][j])]++;
					}
				}
				new_html += ("<div class=\"rep_extra_info grid_block-3\"><div class=\"row-1 col-1\">" + (attr_count.asm > 0 ? "A弾" + attr_count.asm : "") + "</div><div class=\"row-1 col-2\">" + (attr_count.gui > 0 ? "弾" + attr_count.gui : "") + "</div><div class=\"row-1 col-3\">" + (attr_count.aca > 0 ? "アカ" + attr_count.aca : "") + "</div></div>");
			case "none" :
				// do nothing
				new_html += "<div></div>";
			default : 
				// error
				break;
		}
		$("#rep_display").append(new_html + "</div></div>");
	}
}

function rep_update_list() {
	// leftbar part
	var new_html = "";
	for (var i = 0; i < rep_selected.length; ++i) {
		new_html += ("<div id=\"rep_btn_" + i + "\" class=\"rep_list_item\"></div>");
	}
	$("#rep_list_leftbar").html(new_html);
	// list part
	new_html = "";
	var display_artist = $("#list_artist_cb").hasClass("selected");
	var tweet_length = 0;
	for (var i = 0; i < rep_selected.length; ++i) {
		var display_string = song[rep_selected[i]][song_idx.name] + (display_artist ? (" / " + song[rep_selected[i]][song_idx.artist]) : "");
		new_html += ("<div id=\"list_" + i + "\">" + display_string + "</div>");
		for (var j in display_string) {
			tweet_length += /[ -~]/.test(display_string[j]) ? 1 : 2;
		}
		tweet_length++;
	}
	$("#rep_list_content").html(new_html);
	$(".rep_list_wordcount").html("長さ<br />" + tweet_length + "/280");
	$(".rep_list_wordcount").toggleClass("red_text", tweet_length > 280);
}

function rep_update_leftbar() {
	// reset
	$(".rep_list_item").attr("class", "rep_list_item");
		$(".rep_list_delete").addClass("hidden");
	if (rep_edit_selected >= 0) {
		// hiden everything
		$(".rep_list_item").addClass("blank");
		
		// display
		if (rep_edit_selected > 0) {
			$("#rep_btn_" + (rep_edit_selected - 1)).attr("class", "rep_list_item arrow_up");
		}
		$("#rep_btn_" + rep_edit_selected).attr("class", "rep_list_item");
		if (rep_edit_selected < rep_hits.length - 1) {
			$("#rep_btn_" + (rep_edit_selected + 1)).attr("class", "rep_list_item arrow_down");
		}
		// display delete button
		$(".rep_list_delete").removeClass("hidden");
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