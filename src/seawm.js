// External libraries
import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';
var fs = require("fs");
import EWMH from 'ewmh';
import x11 from 'x11';
import x11prop from 'x11-prop';
var exec   = require('child_process').exec;
var keysym = require('keysym');

// Custom libraries
var conversion = require('../lib/conversion');
var logger	 = require('../lib/logger').logger;
import {empty} from './core.js';
import makeStore from './store.js';
import getWindowProperties from '../lib/getWindowProperties.js';

const store = makeStore();

// The workspaces currently available
let ewmh = undefined;

// The available key shortcuts that are known
var config	  = require("../config/config");
var programs	= config.startup_applications;
var keybindings = config.keybindings;
var ks2kc;

/*
function forEachWindow(fn) {
	try {
		const state = store.getState().toJS();
		for (let w of state.widgets) {
			if (w.has('xid')) {
				fn(w);
			}
		}
	}
	catch (e) {
		logger.error("forEachWindow: ERROR");
		logger.error(e.message);
		logger.error(e.stack);
	}
}
*/

var changeWindowAttributeErrorHandler = function(err) {
	if( err.error === 10 ) {
		logger.error("Another Window Manager is already running, AirWM will now terminate.");
	}
	logger.error("changeWindowAttributeErrorHandler:")
	logger.error(JSON.stringify(err));
	process.exit(1);
}

var grabKeyBindings = function(ks2kc, display) {
	logger.info("Grabbing all the keybindings which are configured to have actions in the config.js file.");
	try {
		keybindings.forEach(function(keyConfiguration){
			var keyCode = ks2kc[keysym.fromName(keyConfiguration.key).keysym];
			keyConfiguration.mod = 0;
			for( var i in keyConfiguration.modifier ) {
				keyConfiguration.mod = ( keyConfiguration.mod | conversion.translateModifiers(keyConfiguration.modifier[i]) );
			}
			logger.debug("Grabbing key '%s'.", keyCode);
			// Grab the key with each combination of capslock(2), numlock(16) and scrollock (128)
			var combination = [0,2,16,18,128,130,144,146];
			for( var code in combination ) {
				if( (keyConfiguration.mod&combination[code]) !== 0 ) continue;
				global.X.GrabKey(
					display.screen[0].root,
					0, // Don't report events to the window
					keyConfiguration.mod | combination[code],
					keyCode,
					1, // async pointer mode
					1  // async keyboard mode
				);
			}
		});
	}
	catch (e) {
		logger.error("grabKeyBindings: ERROR");
		logger.error(e.message);
		logger.error(e.stack);
	}
}

var errorHandler = function(err){
	logger.error("errorHandler:")
	logger.error(JSON.stringify(err));
}

function widgetDestroy(w) {
	const xid = w.get('xid');
	if (xid) {
		global.X.DestroyWindow(xid);
	}
}

/*
var closeAllWindows = function(close_id) {
	logger.info("Closing all windows.");
	forEachWindow(widgetDestroy);
}
*/

/*
// when all windows have been closed, set the focus to the root window
var setFocusToRootIfNecessary = function(){
	var screen = screens[0];
	if (screen.workspace.getWindowList().length === 0){
		logger.info("Setting focus to the root window");
		global.X.SetInputFocus(screen.root_xid);
	}
}*/

var commandHandler = function(command) {
	logger.info("Launching airwm-command: '%s'.", command);
	try {
		if (!_.isArray(command))
			command = [command];
		switch(command[0]){
			case "Shutdown":
				closeAllWindows();
				process.exit(0);
				break;
			case "CloseWindow": {
				const state = store.getState().toJS();
				if (state.focusCurrentId) {
					const w = state.widgets[state.focusCurrentId.toString()];
					widgetDestroy(w);
				}
				break;
			}
			case "SwitchTilingMode":
				if( global.focus_window !== null ) {
					global.focus_window.parent.switchTilingMode();
				}
				break;
			case "MoveWindowLeft":
				if( global.focus_window !== null ) {
					global.focus_window.moveLeft();
				}
				break;
			case "MoveWindowDown":
				if( global.focus_window !== null ) {
					global.focus_window.moveDown();
				}
				break;
			case "MoveWindowUp":
				if( global.focus_window !== null ) {
					global.focus_window.moveUp();
				}
				break;
			case "MoveWindowRight":
				if( global.focus_window !== null ) {
					global.focus_window.moveRight();
				}
				break;
			case "SwitchWorkspaceRight":
				workspaces.moveRight();
				break;
			case "SwitchWorkspaceLeft":
				workspaces.moveLeft();
				break;
			default:
				break;
		}
	}
	catch (e) {
		logger.error("commandHandler: ERROR");
		logger.error(e.message);
		logger.error(e.stack);
	}
}

var execHandler = function(program) {
	logger.info("Launching external application: '%s'.", program);
	exec(program);
}

var keyPressHandler = function(ev){
	logger.info("KeyPressHandler is going through all possible keybindings.");
	for(var i = 0; i < keybindings.length; ++i){
		var binding =  keybindings[i];
		// Check if this is the binding which we are seeking.
		if(ks2kc[keysym.fromName(binding.key).keysym] === ev.keycode){
			if( (ev.buttons&(~146)) === binding.mod ){
				if(binding.hasOwnProperty("command")){
					commandHandler(binding.command);
				} else if(binding.hasOwnProperty("program")){
					execHandler(binding.program);
				}
				else if (binding.hasOwnProperty("action")) {
					store.dispatch(binding.action);
				}
			}
		}
	}
}

var destroyNotifyHandler = function(ev){
	logger.info("DestroyNotifier got triggered, removing the window that got destroyed.");
	store.getState().get('widgets').forEach((w, key) => {
		if (w.get('xid') === ev.wid) {
			const action = {
				type: "destroyWidget",
				id: parseInt(key)
			};
			store.dispatch(action);
			return false;
		}
	});
}

/**
 * X11 event to add a new window
 */
function mapRequestHandler(ev) {
	getWindowProperties(global.X, ev.wid).then(props => {
		const widgetType = ({
			'_NET_WM_WINDOW_TYPE_DOCK': 'dock'
		}[props['_NET_WM_WINDOW_TYPE']] || "window");

		const action = {
			type: 'createWidget',
			widget: {
				type: widgetType,
				xid: ev.wid
			}
		};

		if (widgetType === 'dock') {
			let [left, right, top, bottom, left_start_y, left_end_y, right_start_y, right_end_y, top_start_x, top_end_x, bottom_start_x, bottom_end_x] = props["_NET_WM_STRUT_PARTIAL"];
			console.log("addXwinDock: "+props["_NET_WM_STRUT_PARTIAL"]);
			//console.log([left, right, top, bottom]);
			if (top > 0) {
				action.widget.dockGravity = "top";
				action.widget.dockSize = top;
			}
			else if (bottom > 0) {
				action.widget.dockGravity = "bottom";
				action.widget.dockSize = bottom;
			}
		}

		store.dispatch(action);
	});

	/*
	ewmh.update_window_list(xids, err => {
		if (err) {
			throw err;
		}
	});
	ewmh.update_window_list_stacking(xids, err => {
		if (err) {
			throw err;
		}
	});
	*/
}

var eventHandler = function(ev){
	logger.info("Received a %s event.", ev.name);
	try {
		switch( ev.name ) {
		case "ConfigureRequest":
			// Allow requested resize for optimization. Window gets resized
			// automatically by AirWM again anyway.
			X.ResizeWindow(ev.wid, ev.width, ev.height);
			break
		case "MapRequest":
			mapRequestHandler(ev);
			break;
		case "DestroyNotify":
			destroyNotifyHandler(ev);
			break;
		case "EnterNotify":
			console.log("EnterNotify")
			handleFocusEvent(ev);
			break;
		case "KeyPress":
			keyPressHandler(ev);
			break;
		default:
			//logger.error("Unhandled event: "+ev.name);
		}
	}
	catch (e) {
		logger.error("eventHandler: "+JSON.stringify(ev));
		logger.error(e.message);
		logger.error(e.stack);
	}
}

function handleFocusEvent(ev) {
	try {
		let state = store.getState();
		var id;
		state.get('widgets').forEach((w, key) => {
			if (w.get('xid') === ev.wid) {
				id = parseInt(key);
				return false;
			}
		});
		if (id >= 0) {
			store.dispatch({type: 'activateWindow', id: id});
		}
	} catch (e) {
		logger.error("handleFocusEvent: ERROR:")
		logger.error(e.message());
		logger.error(e.stack());
	}
}

//creates the logDir directory when it doesn't exist (otherwise Winston fails)
function initLogger(logDir) {
	if(!fs.existsSync(logDir))
		fs.mkdirSync(logDir);
}

let statePrev = empty;
function handleStateChange() {
	try {
		const state = store.getState();
		let windowSettingsPrev = statePrev.getIn(['x11', 'windowSettings'], Map());
		state.getIn(['x11', 'windowSettings'], Map()).forEach((settings1, key) => {
			windowSettingsPrev = windowSettingsPrev.delete(key);
			const settings0 = statePrev.getIn(['x11', 'windowSettings', key], Map());
			const xid = settings1.get('xid');

			const ChangeWindowAttributes = settings1.get('ChangeWindowAttributes');
			if (ChangeWindowAttributes !== settings0.get('ChangeWindowAttributes')) {
				global.X.ChangeWindowAttributes.apply(global.X, ChangeWindowAttributes.toJS());
			}

			const ConfigureWindow = settings1.get('ConfigureWindow');
			if (ConfigureWindow !== settings0.get('ConfigureWindow')) {
				global.X.ConfigureWindow.apply(global.X, ConfigureWindow.toJS());
			}

			const visible = settings1.get('visible');
			if (visible !== settings0.get('visible')) {
				if (visible)
					global.X.MapWindow(xid);
				else
					global.X.UnmapWindow(xid);
			}
		});

		const SetInputFocus = state.getIn(['x11', 'wmSettings', 'SetInputFocus']);
		if (SetInputFocus && SetInputFocus !== statePrev.getIn(['x11', 'wmSettings', 'SetInputFocus'])) {
			console.log("SetInputFocus:", SetInputFocus);
			global.X.SetInputFocus.apply(global.X, SetInputFocus.toJS());
		}

		windowSettingsPrev.forEach((settings, key) => {
			const xid = settings.get('xid');
			global.X.DestroyWindow(xid);
		});

		statePrev = state;
	} catch (e) {
		logger.error("handleStateChange: ERROR:")
		logger.error(e.message());
		logger.error(e.stack());
	}
}

var airClientCreator = function(err, display) {
	initLogger('logs');
	logger.info("Initializing AirWM client.");
	try {
		// Set the connection to the X server in global namespace
		// as a hack since almost every file uses it
		global.X = display.client;

		const action1 = {
			type: 'initialize',
			desktops: [
				{name: "web", layout: "tile-right"},
				{name: "text", layout: "tile-right"},
				{name: "cli", layout: "tile-right"},
				{name: "prog", layout: "tile-right"},
			],
			screens: _.map(display.screen, (screen) => { return {
				xidRoot: screen.root,
				width: screen.pixel_width,
				height: screen.pixel_height
			}; })
		};
		store.dispatch(action1);

		_.forEach(display.screen, (screen, i) => {
			global.X.AllocColor( screen.default_colormap, 0x5E00, 0x9D00, 0xC800, function(err, color) {
				store.dispatch({type: 'setX11ScreenColors', screenId: i, colors: {focus: color.pixel}});
			});
			global.X.AllocColor( screen.default_colormap, 0xDC00, 0xF000, 0xF700, function(err, color) {
				store.dispatch({type: 'setX11ScreenColors', screenId: i, colors: {normal: color.pixel}});
			});
			global.X.AllocColor( screen.default_colormap, 0x0C00, 0x2C00, 0x5200, function(err, color) {
				store.dispatch({type: 'setX11ScreenColors', screenId: i, colors: {alert: color.pixel}});
			});
		});


		const min_keycode = display.min_keycode;
		const max_keycode = display.max_keycode;
		X.GetKeyboardMapping(min_keycode, max_keycode-min_keycode, function(err, key_list) {
			ks2kc = conversion.buildKeyMap(key_list,min_keycode);

			// Grab all key combinations which are specified in the configuration file.
			grabKeyBindings(ks2kc,display);
		});

		const eventMask = {
			eventMask:
				x11.eventMask.ButtonPress |
				x11.eventMask.EnterWindow |
				x11.eventMask.LeaveWindow |
				x11.eventMask.SubstructureNotify |
				x11.eventMask.SubstructureRedirect |
				x11.eventMask.StructureNotify |
				x11.eventMask.PropertyChange |
				x11.eventMask.ResizeRedirect
		}

		// By adding the substructure redirect you become the window manager.
		logger.info("Registering SeaWM as the current Window Manager.");
		global.X.ChangeWindowAttributes(display.screen[0].root, eventMask, changeWindowAttributeErrorHandler);

		/*
		NOTE: Using EWMH stops the client from receiving a bunch of messages.
		I think that it's probably overwriting the eventMask.

		ewmh = new EWMH(display.client, display.screen[0].root);

		const SUPPORTED_ATOMS = [
			'_NET_CURRENT_DESKTOP',
			'_NET_NUMBER_OF_DESKTOPS',
			'_NET_SUPPORTED',
			//'_NET_WM_STATE_FULLSCREEN',
			//'_NET_SUPPORTING_WM_CHECK',
			//'_NET_WM_NAME',
			//'_NET_WM_STRUT',
			'_NET_WM_STATE',
			'_NET_WM_STRUT_PARTIAL',
			'_NET_WM_WINDOW_TYPE',
			'_NET_WM_WINDOW_TYPE_DESKTOP',
			'_NET_WM_WINDOW_TYPE_DOCK',
			// _NET_WM_WINDOW_TYPE_TOOLBAR, _NET_WM_WINDOW_TYPE_MENU, _NET_WM_WINDOW_TYPE_UTILITY, _NET_WM_WINDOW_TYPE_SPLASH, _NET_WM_WINDOW_TYPE_DIALOG, _NET_WM_WINDOW_TYPE_DROPDOWN_MENU, _NET_WM_WINDOW_TYPE_POPUP_MENU, _NET_WM_WINDOW_TYPE_TOOLTIP, _NET_WM_WINDOW_TYPE_NOTIFICATION, _NET_WM_WINDOW_TYPE_COMBO, _NET_WM_WINDOW_TYPE_DND,
			'_NET_WM_WINDOW_TYPE_NORMAL',
		];
		ewmh.set_supported(SUPPORTED_ATOMS, err => {
			if (err) {
				throw err;
			}
		});

		ewmh.set_number_of_desktops(2, function(err) {
			if (err) {
				throw err;
			}
			ewmh.set_current_desktop(0);
		});

		ewmh.on('CurrentDesktop', function(d) {
			console.log('Client requested current desktop to be: ' + d);
			//screens[0].setWorkspace(d);
		});
		*/

		store.subscribe(handleStateChange);

		// Load the programs that should get started and start them
		logger.info("Launching startup applications.");
		programs.forEach(execHandler);
	}
	catch (e) {
		logger.error("airClientCreator: ERROR:")
		logger.error(e.message());
		logger.error(e.stack());
	}
}

x11.createClient({debug: true}, airClientCreator).on('error', errorHandler).on('event', eventHandler);
