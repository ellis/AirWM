import { logger } from '../logger.js';
import Rectangle from './rectangle.js';
import Screen from './screen.js';

/**
 * A window
 */
export default class Window {
	constructor(window_id, parent, screen) {
		console.log("A");
		this.dimensions = new Rectangle(0,0,1,1);
		console.log("B");
		this.window_id  = window_id;
		console.log("C");
		this.parent     = parent;
		console.log("D");
		this.screen     = screen;
		console.log("E");
	}

	toString() {
		return "{ Window " + this.window_id + " }";
	}

	/**
	 * Move the window in a direction.
	 */
	moveLeft() { move(this,"horizontal",-1); }
	moveRight() { move(this,"horizontal",+1); }
	moveUp() { move(this,"vertical",  -1); }
	moveDown() { move(this,"vertical",  +1); }

	/**
	 * Move the focus in a direction.
	 */
	moveFocusLeft() { moveFocus(this,-1, 0); }
	moveFocusRight() { moveFocus(this,+1, 0); }
	moveFocusUp() { moveFocus(this, 0,-1); }
	moveFocusDown() { moveFocus(this, 0,+1); }

	/**
	 * Show this window, tell X to draw it.
	 */
	show() {
		global.X.MapWindow( this.window_id );
		// Make sure the window is in the correct position again.
		this.redraw();
	}

	/**
	 * Hide this window, tell X not to draw it.
	 */
	hide() {
		global.X.UnmapWindow( this.window_id );
	}

	/**
	 * Focus this window.
	 */
	focus() {
		 global.X.SetInputFocus( this.window_id );
		 var old_focus = global.focus_window;
		 global.focus_window = this;
		 if( old_focus !== null ) old_focus.redraw();
		 this.redraw();
	 }

	/**
	 * Tell X where to position this window and set the
	 * border color.
	 */
	redraw() {
		var color;
		if( this === global.focus_window ) color = this.screen.focus_color;
		else color = this.screen.normal_color;
		global.X.ChangeWindowAttributes(
			this.window_id,
			{
				borderPixel: color
			}
		);
		global.X.ConfigureWindow(
			this.window_id,
			{
				x:           this.dimensions.x,
				y:           this.dimensions.y,
				width:       this.dimensions.width-2*this.screen.border_width,
				height:      this.dimensions.height-2*this.screen.border_width,
				borderWidth: this.screen.border_width,
				stackMode: (this.windowType === 'DESKTOP') ? 1 : 0
			}
		);
	}

	/**
	 * Destroy this window.
	 */
	destroy() {
		global.X.DestroyWindow( this.window_id );
		this.remove();
	}

	/**
	 * Remove this window from the parent container, does not
	 * kill the window process.
	 */
	remove() {
		if(this.parent !== null){
			// Remove this window from the parent container
			this.parent.children.splice(this.parent.children.indexOf(this),1);
			// If the parent container is now empty remove it
			if( this.parent.children.length === 0 ) {
				this.parent.remove();
			}
			// If the parent is now only has 1 child try to merge it upwards
			else if( this.parent.children.length === 1 ) {
				this.parent.merge();
			}
			else {
				this.parent.redraw();
			}
			this.parent = null;
		}
	}

	/**
	 * Execute a function on this window.
	 */
	forEachWindow(callback) {
		callback( this );
	}
}

/**
 * Move the focus to an adjacent window.
 */
function moveFocus(window, horizontal, vertical) {
	// Do a dumb search for the adjacent window
	var adj = null;
	window.screen.forEachWindow(function(new_window){
		if( new_window === window ) return;
		var hor = 0, ver = 0;
		if( new_window.dimensions.x + new_window.dimensions.width < window.dimensions.x )  hor = -1;
		if( new_window.dimensions.x > window.dimensions.x + window.dimensions.width )      hor = 1;
		if( new_window.dimensions.y + new_window.dimensions.height < window.dimensions.y ) ver = -1;
		if( new_window.dimensions.y > window.dimensions.y + window.dimensions.height )     ver = 1;
		if( horizontal === hor && vertical == ver ) {
			if( adj === null ) {
				adj = new_window;
			} else {
				if(
					ver === 0 && Math.abs(new_window.dimensions.x-window.dimensions.x) < Math.abs(adj.dimensions.x-window.dimensions.x) ||
					hor === 0 && Math.abs(new_window.dimensions.y-window.dimensions.y) < Math.abs(adj.dimensions.y-window.dimensions.y)
				) {
					adj = new_window;
				}
			}
		}
	});
	if( adj !== null ) adj.focus();
}

/**
 * Helper function to move a window in a direction.
 *
 * \param window The window to move.
 * \param tiling_mode The tiling mode to move the window in.
 * \param direction The direction to move the window in the array.
 */
function move(window,tiling_mode,direction) {
	let Container = require('./container.js');
	logger.debug("Screen tree before move: " + window.screen.toString());
	check_tree(window.screen.window_tree, window.screen);

	window.remove();

	var win_tree = window.screen.window_tree;
	if( win_tree.tiling_mode!==tiling_mode ) {
		if( win_tree.children.length === 0 ) {
			win_tree.tiling_mode = tiling_mode;
		}
		else if( win_tree.children.length === 1 ) {
			if( win_tree.children[0] instanceof Container ) {
				win_tree                  = win_tree.children[0];
				window.screen.window_tree = win_tree;
				win_tree.parent           = window.screen;
			}
			else {
				win_tree.tiling_mode = tiling_mode;
			}
		}
		else {
			var new_container = new Container(
				new Rectangle(
					win_tree.dimensions.x,
					win_tree.dimensions.y,
					win_tree.dimensions.width,
					win_tree.dimensions.height),
				window.screen,
				window.screen);
			new_container.tiling_mode = tiling_mode;
			win_tree.parent           = new_container;
			window.screen.window_tree = new_container;
			new_container.children.push(win_tree);

			win_tree = new_container;
		}
	}

	// Add the window to the root container
	win_tree.children.splice(
		direction===-1?0:win_tree.children.length,
		0,
		window);
	window.parent = win_tree;
	win_tree.redraw();

	check_tree(window.screen.window_tree, window.screen);
	logger.debug("Screen tree after move: " + window.screen.toString());
}

/**
 * A helper function that checks if the tree invariant
 * is still valid.
 */
function check_tree(container, parent) {
	let Container = require('./container.js');
	if( parent !== container.parent ) {
		logger.error( "Parent isn't correct for", container.toString() );
		logger.error( "\tParent should be", parent.toString() );
		logger.error( "\tBut parent is", container.parent.toString() );
	}
	if( container instanceof Container ) {
		for( var i=0; i<container.children.length; ++i ) {
			check_tree( container.children[i], container );
			if( container.children[i] instanceof Container ) {
				if( container.tiling_mode === container.children[i].tiling_mode ) {
					logger.error( "\tTiling mode incorrect" );
				}
			}
		}
	}
}
