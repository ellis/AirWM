import assert from 'assert';
import Container from './Container.js';
import Frame from './Frame.js'
import Rectangle from './rectangle.js'
import Screen from './screen.js';

/**
 * A workspace in the window manager
 */
export default class Workspace extends Container {
	constructor() {
		super(null, new Rectangle())
		this.screen = null;
		this.focus_window = null;
		this.background = null;
	}

	getScreen() {
		return this.screen;
	}

	// TODO Store a reference to the windows in a map
	// so we can do lookups in ~O(1) via window_id
	//this.window_map = new Map();

	show() {
		if( this.focus_window !== null ) {
			this.focus_window.focus();
		}
		else {
			global.X.SetInputFocus(this.screen.root_window_id);
		}
		super.show();
	}

	hide() {
		this.focus_window = global.focus_window;
		super.hide();
	}
}
