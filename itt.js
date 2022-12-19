/* Instant ToolTip
 * usage
 *   register tooltip
 *     add(<HTML id>, <content of tooltip, in HTML format>, <classes, if any>)
 *   remove tooltip
 *     remove(<HTML id>)
 *     note : itt.remove("*") removes all registered tooltips
 * 
 * note : run itt.init() on document ready
 *        all tooltip will be hidden while mouse down
 */
var itt = {
	disabled : false,
	cur_hover : null,
	init : function() {
		// prevent this being called multiple times
		if (document.getElementById("itt_display") !== null) {
			return;
		}
		document.body.innerHTML += "<div id=\"itt_display\" style=\"position:absolute;top:0px;left:0px;\"></div>";
		document.addEventListener("mousemove", function(e) {
			if (!itt.disabled) {
				itt.check(e.clientX, e.clientY);
			}
		});
		document.addEventListener("mousedown", function(e) {
			// disable this module
			itt.disabled = true;
			// remove anything that's on screen
			itt.hide(itt.cur_hover);
			itt.cur_hover = null;
		});
		document.addEventListener("mouseup", function(e) {
			// enable
			itt.disabled = false;
			itt.check(e.clientX, e.clientY);
		});
	},
	pool : {},
	add : function(id, content, useClass = null) {
		// inject &#8288; in content
		if (content.length > 1) {
			var f = "";
			var in_tag = false;
			for (var i = 0; i < content.length; ++i) {
				if (content[i - 1] === '>' || content[i - 1] === ';') {
					in_tag = false;
				}
				if (content[i] === '<' || content[i - 1] === '&') {
					in_tag = true;
				}
				f += ((in_tag ? "" : '&#8288;') + content[i]);
			}
			content = f;
		}
		var e = document.getElementById(id).getBoundingClientRect();
		itt.pool[id] = {
			"content" : content,
			"width" : null,
			"height" : null,
			"startx" : e.left,
			"starty" : e.top,
			"endx" : e.right,
			"endy" : e.bottom,
			"useClass" : useClass
		};
	},
	remove : function(id) {
		if (id === "*") {
			// delete add
			for (var i in itt.pool) {
				delete itt.pool[i];
			}
		}
		delete itt.pool[id];
	},
	check : function(mouse_x, mouse_y) {
		// check if the mouse is entering / leaving any hitbox
		// get mouse current hover
		var hovering = null;
		for (var i in itt.pool) {
			if (itt.pool[i].startx < mouse_x && mouse_x < itt.pool[i].endx &&
			    itt.pool[i].starty < mouse_y && mouse_y < itt.pool[i].endy) {
				hovering = i;
				break;
			}
		}
		if (hovering === null) {
			// not on anything
			if (itt.cur_hover !== null) {
				// last frame on something -> hide(delete) it
				itt.hide(itt.cur_hover);
				itt.cur_hover = null;
			}
			return;
		}
		if (itt.cur_hover === hovering) {
			// still hovering
			// check if 2nd frame rendering
			if (itt.pool[itt.cur_hover].width === null) {
				// measure width and change if out of screen
				var e = document.getElementById("itt_" + hovering).getBoundingClientRect();
				itt.pool[hovering].width = e.right - e.left;
				itt.pool[hovering].height = e.bottom - e.top;
				itt.cur_hover = hovering;
			}
			itt.track(mouse_x, mouse_y);
			return;
		} else if (itt.cur_hover !== null) {
			// was hovering another Object
			// remove
			itt.hide(itt.cur_hover);
		}
		// create new Object
		itt.display(hovering, mouse_x, mouse_y);
		// finished everything, update
		itt.cur_hover = hovering;
	},
	track : function(mouse_x, mouse_y) {
		var e = document.getElementById("itt_" + itt.cur_hover);
		if (e === null) {
			return;
		}
		var new_x = mouse_x + 10,
			new_y = mouse_y + 10;
		// test if out bound
		if (itt.pool[itt.cur_hover].length !== null) {
			new_x = Math.min(new_x, window.innerWidth - itt.pool[itt.cur_hover].width);
			new_y = Math.min(new_y, window.innerHeight - itt.pool[itt.cur_hover].height);
		}
		// apply value
		e.style.left = new_x;
		e.style.top  = new_y;
	},
	display : function(id, mouse_x, mouse_y) {
		// display tooltip
		var e = document.createElement("div");
		e.id = "itt_" + id;
		e.innerHTML = itt.pool[id].content;
		e.style.position = "absolute";
		e.style.left = mouse_x + 10;
		e.style.top  = mouse_y + 10;
		e.style.width = "auto";
		// apply style if no class specified
		if (itt.pool[id].useClass === null) {
			e.style.border = "2px solid Black";
			e.style.backgroundColor = "White";
		} else {
			// else apply class and let user do the work themselves
			e.classList.add(itt.pool[id].useClass);
		}
		document.getElementById("itt_display").appendChild(e);
	},
	hide : function(id) {
		// remove tooltip
		if (document.getElementById("itt_" + id) === null) {
			return;
		}
		document.getElementById("itt_display").removeChild(document.getElementById("itt_" + id));
	}
};