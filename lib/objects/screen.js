import _ from 'lodash';
import { logger } from '../logger.js';
import Container from './container.js';
import getWindowProperties from '../getWindowProperties.js';
import Rectangle from './rectangle.js';
import x11 from 'x11';

/**
 * A physical screen in the window manager
 */
export default class Screen {
	constructor(screen, workspaces) {
		this.workspaces = workspaces;
		this.workspace = workspaces[0];
		this.mruWorkspaceIndexes = _.range(0, workspaces.length);
		this.background = null;

		this.root_window_id = screen.root;
		this.width          = screen.pixel_width;
		this.height         = screen.pixel_height;
		this.mm_width       = screen.mm_width;
		this.mm_height      = screen.mm_height;

		var self = this;
		global.X.AllocColor( screen.default_colormap, 0x5E00, 0x9D00, 0xC800, function(err, color) {
			self.focus_color = color.pixel;
		});
		global.X.AllocColor( screen.default_colormap, 0xDC00, 0xF000, 0xF700, function(err, color) {
			self.normal_color = color.pixel;
		});
		global.X.AllocColor( screen.default_colormap, 0x0C00, 0x2C00, 0x5200, function(err, color) {
			self.alert_color = color.pixel;
		});

		// The number of pixels between each screen, currently hardcoded
		// to 3mm
		this.margin       = parseInt(this.width/this.mm_width * 3);
		// The number of pixels of border around each window, currently
		// hardcoded to 1.5mm
		this.border_width = parseInt(this.width/this.mm_width * 1.5);

		this.workspace.screen = this;
		this.workspace.dimensions = { x: 0, y: 0, width: this.width, height: this.height };
	}

	toString() {
		return "{ Screen " + this.root_window_id + " " + this.workspace.toString() + " }";
	}

	setWorkspace(wid) {
		if (this.workspace) {
			this.workspace.hide();
		}
		this.workspace = this.workspaces[wid];
		if (this.workspace) {
			this.workspace.screen = this;
			this.workspace.dimensions = { x: 0, y: 0, width: this.width, height: this.height };
			this.workspace.show();
		}
	}

	addXwin(xid) {
		console.log({xid});
		const self = this;
		global.X.GetWindowAttributes(xid, function(err, attributes) {
			//console.log("A");
			if (err) {
				console.log("ERR: "+err);
			}
			// Don't manage a window when a redirect-override flag is set.
			// (don't create windows for small popups e.g. firefox search history)
			if (attributes[8])
			{
				global.X.MapWindow(xid);
				return;
			}

			//console.log("B");
			getWindowProperties(global.X, xid).then(props => {
				console.log("C");
				console.log(JSON.stringify(props));
				//console.log(_.contains(props['_NET_WM_WINDOW_TYPE']));
				//logger.info(JSON.stringify(props));
				if (_.contains(props['_NET_WM_WINDOW_TYPE'], '_NET_WM_WINDOW_TYPE_DESKTOP')) {
					console.log("D1");
					console.log(xid);
					console.log(props);
					console.log("O")
					logger.debug("window of a DESKTOP type")
					console.log(self.workspace);
					console.log(self.workspace.setXwinBackground);
					self.workspace.setXwinBackground(xid, props);
					console.log("P")
				}
				else if (_.contains(props['_NET_WM_WINDOW_TYPE'], '_NET_WM_WINDOW_TYPE_DOCK')) {
					//console.log("D2");
					logger.debug("window of a DOCK type")
					self.workspace.addXwinDock(xid, props);
				}
				else {
					//console.log("D");
					global.X.ChangeWindowAttributes(
						xid,
						{ eventMask: x11.eventMask.EnterWindow }
					);
					//console.log("E");
					//console.log("E"+JSON.stringify(self.workspace));
					self.workspace.addXwin(xid, props);
					console.log("F");
					if( global.focus_window === null ) {
						console.log("F1");
						console.log(self.workspaces);
						for (var space of self.workspaces) {
							console.log("F11");
							space.forEachWindow(function(window) {
								console.log("F111: ");
								console.log({xid2: window.xid, xid});
								if(window.xid === xid){
									console.log("F1111");
									window.focus();
								}
							});
						}
					}
					console.log("G");
				}
			});
		});
	}

	closeAllWindows(){
		this.workspace.destroyChildren();
	}

	forEachWindow(callback) {
		this.workspace.forEachWindow(callback);
	}
}
