import _ from 'lodash';
import Frame from './Frame.js';

/**
 * A container organizes a set of children, which may be windows or other containers.
 */
export default class Container {
	constructor(parent, dimensions) {
		this.dimensions  = dimensions;
		this.tiling_mode = "horizontal";
		this.parent      = parent;
		this.children    = [];
		this.background = null;
		this.autoremove = true;
	}

	getScreen() {
		console.log("getScreen(this="+this+")")
		if (this.parent)
			return this.parent.getScreen();
		else
			return null;
	}

	getWindowList() {
		return _.flatten(this.children, child => { return child.getWindowList(); });
	}

	toString() {
		var res = "{ Container " + this.tiling_mode + " [ ";
		for( var i=0; i<this.children.length; ++i ) {
			res += this.children[i].toString() + " ";
		}
		res += "] }";
		return res;
	}

	/**
	 * Add a window to this container.
	 * \param window_id The window id of the window
	 */
	addXwin(xid, props) {
		//console.log({xid, props});
		//console.log("A");
		const f = new Frame(this, xid, props);
		//console.log("B");
		this.children.push(f);
		//console.log("C");
		this.redraw();
		//console.log("D");
		f.show();
		//console.log("X");
	}

	setXwinBackground(xid, props) {
		console.log("Container.setXWinBackground: "+{xid,props});
		//console.log("wid: "+JSON.stringify(wid));
		//console.log("A");
		//console.log("Window: "+Window);
		var w;
		try {
			w = new Frame(this, xid, props);
			w.windowType = 'DESKTOP';
			w.dimensions = this.dimensions;
			w.show();
			this.background = w;
			this.redraw();
		} catch (e) {
			console.log("e: "+e.toString());
		}
	}

	addXwinDock(wid, props) {
		let [left, right, top, bottom, left_start_y, left_end_y, right_start_y, right_end_y, top_start_x, top_end_x, bottom_start_x, bottom_end_x] = props["_NET_WM_STRUT_PARTIAL"];
	}

	/**
	 * Recalculate the dimensions of the children in this container
	 * and tell them to also redraw. If a child is a window it re-
	 * positions in X.
	 */
	redraw() {
		console.log(1)
		if (this.background) {
			console.log(2)
			this.background.dimensions = this.dimensions;
			this.background.redraw();
		}

		console.log(this);
		const screen = this.getScreen();
		const dimensions = {
			x: this.dimensions.x + screen.margin,
			y: this.dimensions.y + screen.margin,
			width: this.dimensions.width - 2*screen.margin,
			height: this.dimensions.height - 2*screen.margin
		};
		if( this.tiling_mode === "horizontal" ) {
			console.log(3)
			var child_width = parseInt( (dimensions.width-(this.children.length-1)*screen.margin) / this.children.length);
			console.log(31)
			for( var i=0; i<this.children.length; ++i ) {
				console.log(32)
				this.children[i].dimensions.x      = dimensions.x + (child_width+screen.margin)*i;
				this.children[i].dimensions.y      = dimensions.y;
				this.children[i].dimensions.width  = child_width;
				this.children[i].dimensions.height = dimensions.height;
				console.log("L1");
				this.children[i].redraw();
			}
		}
		else {
			console.log(4)
			var child_height = parseInt( (dimensions.height-(this.children.length-1)*screen.margin) / this.children.length);
			for( var i=0; i<this.children.length; ++i ) {
				this.children[i].dimensions.x      = dimensions.x;
				this.children[i].dimensions.y      = dimensions.y + (child_height+screen.margin)*i;
				this.children[i].dimensions.width  = dimensions.width;
				this.children[i].dimensions.height = child_height;
				console.log("L2");
				this.children[i].redraw();
			}
		}
	}

	destroyChild(child) {
		const i = this.children.indexOf(child);
		if (i >= 0) {
			child.destroyChildren();
			this.children.splice(i, 1);
			if (_.isEmpty(this.children) && this.autoremove) {
				if (this.parent) {
					this.parent.destroyChild(this);
				}
			}
			else {
				this.redraw();
			}
		}
	}

	/**
	 * Remove this container
	 */
	destroyChildren() {
		for (child of this.children) {
			child.destroy();
		}
		this.children = [];
	}

	/**
	 * Try to merge this container upwards.
	 */
	merge() {
		if( this.parent instanceof Container ) {
			this.parent.children.splice(
				this.parent.children.indexOf(this),
				1,
				this.children[0]);
			this.children[0].parent = this.parent;
			if( this.parent.children.length === 1 ) {
				this.parent.merge();
			}
			else {
				this.parent.redraw();
			}
		}
		else {
			this.redraw();
		}
	}

	/**
	 * Execute a function on all windows in this container.
	 */
	forEachWindow(callback) {
		//console.log("Container.forEachWindow()");
		for (let child of this.children) {
			child.forEachWindow(callback);
		}
	}

	/**
	 * Switches the tiling mode from vertical to horizontal or vice versa
	 */
	switchTilingMode() {
		if(this.tiling_mode === "horizontal")
			this.tiling_mode = "vertical";
		else
			this.tiling_mode = "horizontal";

		this.redraw();
	}

	show() {
		if (this.background)
			this.background.show();
		this.forEachWindow(function(window) {
			window.show();
		});
	}

	hide() {
		if (this.background)
			this.background.hide();
		this.forEachWindow(function(window) {
			window.hide();
		});
	}
}
