// repertoire section
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
// type of all songs
var rep_list = [];
// singer selection
var rep_singer = [1, 1, 1];
// singer selection method
var rep_is_union = true;
// attribute selection
// (not used)
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

$(function() {
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
			// create a lookup array for all songs for the current member selection
			var entry_count = [];
			for (var i in song) {
				if (selected_member === 7) {
					entry_count[i] = entry_proc[i].length;
					continue;
				}
				entry_count[i] = 0;
				for (var j in entry_proc[i]) {
					if (entry[entry_proc[i][j]][entry_idx.type] & selected_member) {
						entry_count[i]++;
					} 
				}
			}
			rep_hits.sort((a, b) => {
				if (entry_count[b] === entry_count[a]) {
					return 0;
				}
				return (rep_sort_asd ? 1 : -1) * (entry_count[b] - entry_count[a]);
			});
			break;
		case "date" : {
			// sort with last sang date
			var date_lookup = [];
			for (var i in song) {
				var dummy = get_last_sang(i, selected_member);
				date_lookup[i] = dummy ? dummy.getTime() : 0;
			}
			rep_hits.sort((a, b) => {
				if (date_lookup[a] === date_lookup[b]) {
					return 0;
				}
				return (rep_sort_asd ? 1 : -1) * (date_lookup[b] - date_lookup[a]);
			});
			break;
		}
		case "release" : {
			// release date of song
			var date_lookup = [];
			for (var i = 1; i < song.length; ++i) {
				date_lookup[i] = to8601(song[i][song_idx.release]).getTime();
			}
			rep_hits.sort((a, b) => {
				if (date_lookup[a] === date_lookup[b]) {
					return 0;
				}
				return (rep_sort_asd ? 1 : -1) * (date_lookup[b] - date_lookup[a]);
			});
			break;
		}
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
		var new_html = "<div class=\"rep_song_container" + (rep_selected.includes(rep_hits[i]) ? " selected" : "") + (sang_count[0] === sang_count[1] ? " rep_mem_only" : "") + "\" id=\"rep_song_" + rep_hits[i] + "\">";
		// title
		new_html += ("<div class=\"rep_song_title\">" + song[rep_hits[i]][song_idx.name] + " / " + song[rep_hits[i]][song_idx.artist] + "</div>");
		// info line1
		new_html += "<div class=\"rep_song_info grid_block-4\">";
		// last sang
		var delta_last = get_date_different(get_last_sang(rep_hits[i], selected_member));
		new_html += ("<div>" + (delta_last === 0 ? "今日" : (delta_last + "日前")) + "</div>");
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

