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
import State from './state.js';
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
			case "SwitchTilingMode":
				if( global.focus_window !== null ) {
					global.focus_window.parent.switchTilingMode();
				}
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

function handleClientMessage(ev) {
	global.X.GetAtomName(ev.type, function(err, name) {
		console.log({name, ev})
		switch (name) {
		case '_NET_ACTIVE_WINDOW': {
			const id = findWidgetIdForXid(ev.wid);
			if (id >= 0) {
				store.dispatch({type: 'activateWindow', id: id});
			}
			break;
		}
		case '_NET_CLOSE_WINDOW':
			destroyNotifyHandler(ev);
			break;

		case '_NET_CURRENT_DESKTOP':
			store.dispatch({type: 'activateDesktop', num: ev.data[0]});
			break;

		case '_NET_WM_DESKTOP':
			// FIXME: need to use ev.wid rather than assuming that this is for the current window
			store.dispatch({type: 'moveWindowToDesktop', desktop: ev.data[0]});
			break;
		}
	});
}

function findWidgetIdForXid(xid) {
	let id;
	store.getState().get('widgets').forEach((w, key) => {
		if (w.get('xid') === xid) {
			id = parseInt(key);
			return false;
		}
	});
	return id;
}

var destroyNotifyHandler = function(ev){
	logger.info("DestroyNotifier got triggered, removing the window that got destroyed.");
	const id = findWidgetIdForXid(ev.wid);
	if (id >= 0) {
		store.dispatch({type: 'destroyWidget', id: id});
	}
}

function handlePreExistingWindow(xid) {
	logger.info(`handlePreExistingWindow(${xid})`);
	global.X.GetWindowAttributes(xid, function(err, attrs) {
		if (err) throw err;

		console.log({attrs});
		// If this window is not visible:
		if (attrs.mapState !== 2) {
			logger.info("window isn't visible")
			return;
		}

		// If the override-redirect flag is set, don't manage:
		if (attrs.overrideRedirect) {
			logger.info("window has overrideRedirect");
			//return;
		}

		createWidgetForXid(xid);
	});
}

function handleNewWindow(xid) {
	let log = `handleNewWindow(${xid})`;
	global.X.GetWindowAttributes(xid, function(err, attrs) {
		if (err) { logger.error(log); throw err; }

		// If the override-redirect flag is set, don't manage:
		if (!attrs.overrideRedirect) {
			// don't manage
			logger.info(log+": window has overrideRedirect");
			//X.MapWindow(xid);
			//return;
		}

		createWidgetForXid(xid);
	});
}

function createWidgetForXid(xid) {
	logger.info(`createWidgetForXid(${xid})`);
	getWindowProperties(global.X, xid).then(props => {
		const widgetType = ({
			'_NET_WM_WINDOW_TYPE_DOCK': 'dock',
			'_NET_WM_WINDOW_TYPE_DESKTOP': 'background',
			//'_NET_WM_WINDOW_TYPE_DESKTOP': 'window',
		}[props['_NET_WM_WINDOW_TYPE']] || "window");

		const action = {
			type: 'createWidget',
			widget: {
				type: widgetType,
				xid
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
}

let eventNamePrev = undefined;
var eventHandler = function(ev){
	// Only log first of sequential MotionNotify events
	if (ev.name !== "MotionNotify" || eventNamePrev !== "MotionNotify")
		logger.info(`event ${ev.name}`);//: ${JSON.stringify(ev)}`);
	eventNamePrev = ev.name;
	try {
		switch( ev.name ) {
		case 'ClientMessage':
			handleClientMessage(ev);
			break;
		/*case "ConfigureNotify":
			console.log(ev)
			break;*/
		case "ConfigureRequest":
			// Allow requested resize for optimization. Window gets resized
			// automatically by AirWM again anyway.
			X.ResizeWindow(ev.wid, ev.width, ev.height);
			break
		// Show a window
		case "MapRequest":
			handleNewWindow(ev.wid);
			break;
		case "MotionNotify":
			handleMotionNotify(ev);
			break;
		case "DestroyNotify":
			destroyNotifyHandler(ev);
			break;
		case "EnterNotify":
			handleEnterNotify(ev);
			break;
		case "LeaveNotify":
			handleLeaveNotify(ev);
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

/**
 * After activating a window, ignoreEnterNotify should be set to true.
 * This will lead ignoring the next EnterNotify event.
 * This way, when the user switches desktops, the window under the mouse
 * doesn't get automatically selected.
 * TODO: This strategy won't be entirely adequate, because it won't handle
 * the case of a new window opening, where we also shouldn't automatically
 * switch to the window under the cursor!  We could possibly save the
 * positition of the mouse from the previous EnterNotify, and ignore any
 * future events at the same position.
 */
let handleEnterNotifyCoordsPrev = {};
let ignoreEnterNotify = true;
function handleEnterNotify(ev) {
	console.log(ev);
	try {
		const coords = _.pick(ev, ['rootx', 'rooty']);
		console.log({coords, ev, handleEnterNotifyCoordsPrev});
		if (!ignoreEnterNotify && !_.isEqual(coords, handleEnterNotifyCoordsPrev)) {
			let state = store.getState();
			var id = undefined;
			state.get('widgets').forEach((w, key) => {
				if (w.get('xid') === ev.wid) {
					switch (w.get('type')) {
						case 'window':
							id = parseInt(key);
							break;
						default:
							break;
					}
					return false;
				}
			});
			//_focusId = id;
			if (id >= 0) {
				store.dispatch({type: 'activateWindow', id: id});
			}
		}
		handleEnterNotifyCoordsPrev = coords;
		ignoreEnterNotify = false;
	} catch (e) {
		logger.error("handleEnterNotify: ERROR:")
		logger.error(e.message);
		logger.error(e.stack);
	}
}

function handleLeaveNotify(ev) {
	const coords = _.pick(ev, ['rootx', 'rooty']);
	console.log({coords, ev, handleEnterNotifyCoordsPrev});
	handleEnterNotifyCoordsPrev = coords;
}

function handleMotionNotify(ev) {
	/*if (_focusId >= 0) {
		const id = _focusId;
		_focusId = undefined;
		store.dispatch({type: 'activateWindow', id});
	}*/
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
		// If the active window has changed, set ignoreEnterNotify = true
		if (state.getIn(['x11', 'wmSettings', 'ewmh', '_NET_ACTIVE_WINDOW', 0]) !== statePrev.getIn(['x11', 'wmSettings', 'ewmh', '_NET_ACTIVE_WINDOW', 0])) {
			console.log("ignoreEnterNotify = true")
			ignoreEnterNotify = true;
		}
		// Settings for each window
		let windowSettingsPrev = statePrev.getIn(['x11', 'windowSettings'], Map());
		state.getIn(['x11', 'windowSettings'], Map()).forEach((settings1, key) => {
			windowSettingsPrev = windowSettingsPrev.delete(key);
			const settings0 = statePrev.getIn(['x11', 'windowSettings', key], Map());
			const xid = settings1.get('xid');

			const ChangeWindowAttributes = settings1.get('ChangeWindowAttributes');
			if (ChangeWindowAttributes !== settings0.get('ChangeWindowAttributes')) {
				global.X.ChangeWindowAttributes.apply(global.X, ChangeWindowAttributes.toJS(), (err) => {
					if (err) {
						console.log(1)
						console.log({err});
						console.log(2)
						throw err;
					}
				});
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

			// EWMH hints
			settings1.getIn(['ewmh'], Map()).forEach((value, name) => {
				if (value !== statePrev.getIn(['x11', 'windowSettings', key, 'ewmh', name])) {
					const value2 = Map({value}).toJS().value;
					handleEwmh(xid, name, value2);
				}
			});
		});

		// Set the X11 focus
		const SetInputFocus = state.getIn(['x11', 'wmSettings', 'SetInputFocus']);
		if (SetInputFocus && SetInputFocus !== statePrev.getIn(['x11', 'wmSettings', 'SetInputFocus'])) {
			console.log("SetInputFocus:", SetInputFocus);
			global.X.SetInputFocus.apply(global.X, SetInputFocus.toJS());
		}

		// Set EWMH (extended window manager hints)
		if (true) {
			const screen = State.getCurrentScreen(state);
			const xid = screen.get('xidRoot');
			state.getIn(['x11', 'wmSettings', 'ewmh']).forEach((value, name) => {
				if (value !== statePrev.getIn(['x11', 'wmSettings', 'ewmh', name])) {
					const value2 = Map({value}).toJS().value;
					handleEwmh(xid, name, value2);
				}
			});
		}

		// Delete windows that have been removed
		windowSettingsPrev.forEach((settings, key) => {
			const xid = settings.get('xid');
			global.X.DestroyWindow(xid);
		});

		statePrev = state;
	} catch (e) {
		logger.error("handleStateChange: ERROR:")
		logger.error(e.message);
		logger.error(e.stack);
	}
}

let ewmhPropTypeFormatInfos;
function handleEwmh(xid, name, value) {
	const info = ewmhPropTypeFormatInfos[name];
	if (info) {
		logger.info(`set EWMH ${name} ${xid} = ${JSON.stringify(value)}`);
		const [type, format] = info;
		// If the type is ATOM, make sure strings get converted to atoms.
		if (type === global.X.atoms.ATOM) {
			if (!_.isArray(value))
				value = [value];
			Promise.all(
				value.map(x => new Promise((resolve, reject) => {
					if (_.isString(x)) {
						global.X.InternAtom(false, x, (err, result) => {
							if (err) return reject(err);
							resolve(result);
						});
					} else {
						resolve(x);
					}
				}))
			).then(atoms => {
				x11prop.set_property(global.X, xid, name, type, format, atoms);
			});
		}
		else {
			x11prop.set_property(global.X, xid, name, type, format, value);
		}
	}
	else {
		logger.error(`unknown EWMH property: ${name} = ${value}`);
	}
}

var airClientCreator = function(err, display) {
	initLogger('logs');
	logger.info("Initializing AirWM client.");
	try {
		// Set the connection to the X server in global namespace
		// as a hack since almost every file uses it
		global.X = display.client;
		ewmhPropTypeFormatInfos = {
			'WM_STATE': ['WM_STATE', 32],
			'_NET_ACTIVE_WINDOW': [global.X.atoms.WINDOW, 32],
			'_NET_CLIENT_LIST': [global.X.atoms.WINDOW, 32],
			'_NET_CLIENT_LIST_STACKING': [global.X.atoms.WINDOW, 32],
			'_NET_CURRENT_DESKTOP': [global.X.atoms.CARDINAL, 32],
			'_NET_NUMBER_OF_DESKTOPS': [global.X.atoms.CARDINAL, 32],
			'_NET_WM_ALLOWED_ACTIONS': [global.X.atoms.ATOM, 32],
			'_NET_WM_DESKTOP': [global.X.atoms.CARDINAL, 32],
			'_NET_WM_STATE': ['_NET_WM_STATE', 32],
		};

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
				//x11.eventMask.StructureNotify |
				x11.eventMask.PointerMotion |
				x11.eventMask.PropertyChange |
				x11.eventMask.ResizeRedirect
		}

		// By adding the substructure redirect you become the window manager.
		logger.info("Registering SeaWM as the current Window Manager.");
		global.X.ChangeWindowAttributes(display.screen[0].root, eventMask, changeWindowAttributeErrorHandler);

		/*
		//NOTE: Using EWMH stops the client from receiving a bunch of messages.
		//I think that it's probably overwriting the eventMask.

		ewmh = new EWMH(display.client, display.screen[0].root);
		ewmh.set_number_of_desktops(action1.desktops.length, function(err) {
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

		const SUPPORTED_ATOMS = [
			'_NET_CURRENT_DESKTOP',
			'_NET_NUMBER_OF_DESKTOPS',
			'_NET_SUPPORTED',
			'_NET_WM_ALLOWED_ACTIONS',
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
		const cb = (err) => { if(err) throw err; };
		x11prop.set_property(global.X, display.screen[0].root, '_NET_SUPPORTED', global.X.atoms.ATOM, 32, SUPPORTED_ATOMS, cb);

		global.X.QueryTree(display.screen[0].root, function(err, tree) {
			console.log({err, tree});
			if (err) throw err;
			tree.children.forEach(handlePreExistingWindow);
		});

		store.subscribe(handleStateChange);

		// Load the programs that should get started and start them
		logger.info("Launching startup applications.");
		//programs.forEach(execHandler);
	}
	catch (e) {
		logger.error("airClientCreator: ERROR:")
		logger.error(e.message);
		logger.error(e.stack);
	}
}

x11.createClient({debug: true}, airClientCreator).on('error', errorHandler).on('event', eventHandler);
