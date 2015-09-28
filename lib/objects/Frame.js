import { logger } from '../logger.js';
import Rectangle from './rectangle.js';
import Screen from './screen.js';

/**
 * A window
 */
export default class Frame {
	constructor(parent, xid, props) {
		//console.log("Q")
		//console.log({parent, xid, props});
		this.dimensions = new Rectangle(0,0,1,1);
		//console.log("R")
		this.parent = parent;
		this.xid = xid;
		this.props = props;
		//console.log("S")
	}

	getWindowList() {
		return [this];
	}

	getScreen() {
		return this.parent.getScreen();
	}

	setXwin(xid, props) {
		this.xid = xid;
		this.props = props;
	}

	toString() {
		return "{ Frame " + this.xid + " }";
	}

	/**
	 * Show this window, tell X to draw it.
	 */
	show() {
		if (this.xid) {
			global.X.MapWindow( this.xid );
			// Make sure the window is in the correct position again.
			this.redraw();
		}
	}

	/**
	 * Hide this window, tell X not to draw it.
	 */
	hide() {
		if (this.xid) {
			global.X.UnmapWindow( this.xid );
		}
	}

	/**
	 * Focus this window.
	 */
	focus() {
		if (this.xid) {
			global.X.SetInputFocus( this.xid );
			const old_focus = global.focus_window;
			global.focus_window = this;
			if( old_focus !== null ) old_focus.redraw();
			this.redraw();
		 }
	 }

	/**
	 * Tell X where to position this window and set the
	 * border color.
	 */
	redraw() {
		if (this.xid) {
			console.log({xid: this.xid, dimensions: this.dimensions});
			const screen = this.getScreen();
			const color = (this === global.focus_window)
				? screen.focus_color
				: screen.normal_color;
			const borderWidth = (this.windowType === 'DESKTOP' || this.windowType === 'DOCK')
				? 0
				: screen.border_width;
			if (borderWidth > 0) {
				global.X.ChangeWindowAttributes(
					this.xid,
					{
						borderPixel: color
					}
				);
			}
			global.X.ConfigureWindow(
				this.xid,
				{
					x:           this.dimensions.x,
					y:           this.dimensions.y,
					width:       this.dimensions.width - 2*borderWidth,
					height:      this.dimensions.height - 2*borderWidth,
					borderWidth: borderWidth,
					stackMode: (this.windowType === 'DESKTOP') ? 1 : 0
				}
			);
		}
	}

	/**
	 * Destroy this window.
	 */
	destroyChildren() {
		global.X.DestroyWindow( this.xid );
		this.xid = null;
	}

	/**
	 * Execute a function on this window.
	 */
	forEachWindow(callback) {
		callback( this );
	}
}
