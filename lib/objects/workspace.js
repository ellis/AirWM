import Screen from './screen.js';
import Window from './window.js'

/**
 * A workspace in the window manager
 */
function Workspace( screens ) {
	this.screens      = [];
	this.focus_window = null;
	this.desktopWindow = null;

	for( var i=0; i<screens.length; ++i ) {
		this.screens.push( new Screen( screens[i], this ) );
	}

	// TODO Store a reference to the windows in a map
	// so we can do lookups in ~O(1) via window_id
	//this.window_map = new Map();

	this.toString = function() {
		var res = "{ Workspace [ ";
		for( var i=0; i<this.screens.length; ++i ) {
			res += this.screens[i].toString() + " ";
		}
		res += "] }";
		return res;
	}

	this.setDesktopWindow = function(wid) {
		//console.log("wid: "+JSON.stringify(wid));
		// Basically copied from Container
		const screen = this.screens[0];
		//console.log("A");
		//console.log("Window: "+Window);
		var w;
		try {
			w = new Window(wid, this, screen);
		} catch (e) {
			console.log("e: "+e.toString());
		}
		//console.log("AA");
		w.windowType = 'DESKTOP';
		w.dimensions.x      = 0;
		w.dimensions.y      = 0;
		w.dimensions.width  = screen.width;
		w.dimensions.height = screen.height;
		this.desktopWindow = w;
		//console.log("B");
		//console.log("C");
		w.show();
		//console.log("w: "+JSON.stringify(w));
	}

	this.addDockWindow = function(wid, properties) {
		CONTINUE
	}

	this.addWindow = function(window_id) {
		this.screens[0].addWindow(window_id);
	}

	this.show = function() {
		if( this.focus_window !== null ) {
			this.focus_window.focus();
		}
		else {
			global.X.SetInputFocus(this.screens[0].root_window_id);
		}
		if (this.desktopWindow)
			this.desktopWindow.show();
		this.forEachWindow(function(window) {
			window.show();
		});
	}

	this.hide = function() {
		if (this.desktopWindow)
			this.desktopWindow.hide();
		this.forEachWindow(function(window) {
			window.hide();
		});
		this.focus_window = global.focus_window;
	}

	this.forEachWindow = function(callback) {
		for( var i=0; i<this.screens.length; ++i ) {
			this.screens[i].forEachWindow(callback);
		}
	}
}

module.exports.Workspace = Workspace;
