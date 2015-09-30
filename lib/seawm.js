// External libraries
import _ from 'lodash';
var fs = require("fs");
import EWMH from 'ewmh';
var x11	= require('x11');
var exec   = require('child_process').exec;
var keysym = require('keysym');

// Custom libraries
var conversion = require('./conversion');
var logger	 = require('./logger').logger;
import {empty} from './core.js';
import makeStore from './store.js';

const store = makeStore();

// The workspaces currently available
let ewmh = undefined;

// The available key shortcuts that are known
var config	  = require("../config/config");
var programs	= config.startup_applications;
var keybindings = config.keybindings;
var ks2kc;

function forEachWindow(fn) {
	const state = store.getState().toJS();
	for (let w of state.widgets) {
		if (w.xid) {
			fn(w);
		}
	}
}

var changeWindowAttributeErrorHandler = function(err) {
	if( err.error === 10 ) {
		logger.error("Another Window Manager is already running, AirWM will now terminate.");
	}
	logger.error("changeWindowAttributeErrorHandler:")
	logger.error(JSON.stringify(err));
	process.exit(1);
}

var grabKeyBindings = function(ks2kc, display) {
	logger.debug("Grabbing all the keybindings which are configured to have actions in the config.js file.");
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

var errorHandler = function(err){
	logger.error("errorHandler:")
	console.trace();
	logger.error(JSON.stringify(err));
}

function widgetDestroy(w) {
	global.X.DestroyWindow(w.xid);
}

var closeAllWindows = function(close_id) {
	logger.info("Closing all windows.");
	forEachWindow(widgetDestroy);
}

// when all windows have been closed, set the focus to the root window
var setFocusToRootIfNecessary = function(){
	var screen = screens[0];
	if (screen.workspace.getWindowList().length === 0){
		logger.info("Setting focus to the root window");
		global.X.SetInputFocus(screen.root_xid);
	}
}

var commandHandler = function(command) {
	logger.info("Launching airwm-command: '%s'.", command);
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
		case "SelectFrameNext":
			console.log("YP")
			if( global.focus_window !== null ) {
				console.log(1);
				const ws = screens[0].workspace.getWindowList();
				console.log(2);
				const i = ws.indexOf(global.focus_window);
				console.log(3);
				if (i >= 0) {
					console.log(3);
					const j = (i + 1) % ws.length;
					ws[j].focus();
				}
			}
			break;
		case "SelectFramePrev":
			if( global.focus_window !== null ) {
				const ws = screens[0].workspace.getWindowList();
				const i = ws.indexOf(global.focus_window);
				if (i >= 0) {
					const j = (i == 0) ? ws.length - 1 : i - 1;
					ws[j].focus();
				}
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

var execHandler = function(program) {
	logger.info("Launching external application: '%s'.", program);
	exec(program);
}

var keyPressHandler = function(ev){
	logger.debug("KeyPressHandler is going through all possible keybindings.");
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
			}
		}
	}
}

var destroyNotifyHandler = function(ev){
	logger.debug("DestroyNotifier got triggered, removing the window that got destroyed.");
	forEachWindow(function(window) {
		if( window.xid === ev.wid ) {
			window.parent.destroyChild(window);
			if( global.focus_window === window ) {
				var w = null;
				forEachWindow(function(window) {
					w = window;
				});
				if( w !== null ) w.focus();
			}
		}
	});
	setFocusToRootIfNecessary();
}

/**
 * X11 event to add a new window
 */
function mapRequestHandler(ev) {
	store.dispatch({
		type: 'addWidget',
		widget: {
			xid: ev.wid
		}
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
		logger.error("eventHandler: "+ev);
		logger.error(e.message);
		logger.error(e.stack);
		console.trace();
	}
}

function handleFocusEvent(ev) {
	let state = store.getState();
	var id;
	state.get('widgets').forEach((w, key) => {
		if (w.xid === ev.wid) {
			id = parseInt(key);
			return false;
		}
	});
	if (id >= 0) {
		store.dispatch({type: 'setFocusWidget', id: id});
	}
}

//creates the logDir directory when it doesn't exist (otherwise Winston fails)
var initLogger = function (logDir){
	if(!fs.existsSync(logDir))
		fs.mkdirSync(logDir);
}

function getWidgetDesktopId(state, w, id = -1) {
	if (w.hasOwnProperty('screenId'))
		return id;
	else if (w.hasOwnProperty('parentId'))
		return getWidgetDesktopId(state, state.widgets[w.parentId.toString()], w.parentId);
	else
		return -1;
}

function getWidgetScreenId(state, w) {
	if (w.hasOwnProperty('screenId'))
		return w.screenId;
	else if (w.hasOwnProperty('parentId'))
		return getWidgetScreenId(state, state.widgets[w.parentId.toString()]);
	else
		return -1;
}

let screensX11 = [];
let windowInfosPrev = {};
function handleStateChange() {
	const state = store.getState().toJS();
	//console.log(JSON.stringify(state, null, '\t'));
	const windowInfos = {};
	_.forEach(state.widgets, (w, key) => {
		if (w.xid) {
			const hasFocus = (key === _.get(state, 'focusWidgetId', -1).toString());
			const info = {
				xid: w.xid,
				visible: w.visible,
				focus: hasFocus
			};
			if (w.visible) {
				const desktopId = _.get(state, 'desktopIds', [])[w.desktopNum];
				const desktop = state.widgets[desktopId.toString()];
				const screenX11 = screensX11[desktop.screenId];
				const borderWidth = 5;
				const color = (hasFocus)
					? screenX11.focus_color
					: screenX11.normal_color;
				info.ChangeWindowAttributes = [
					w.xid,
					{
						borderPixel: color
					}
				];
				info.ConfigureWindow = [
					w.xid,
					{
						x: w.rc[0],
						y: w.rc[1],
						width: w.rc[2] - 2*borderWidth,
						height: w.rc[3] - 2*borderWidth,
						borderWidth: borderWidth,
						stackMode: (w.windowType === 'DESKTOP') ? 1 : 0
					}
				];
			}

			const info0 = windowInfosPrev[key] || {};
			if (!_.isEqual(info0.ChangeWindowAttributes, info.ChangeWindowAttributes)) {
				global.X.ChangeWindowAttributes.apply(global.X, info.ChangeWindowAttributes);
			}
			if (!_.isEqual(info0.ConfigureWindow, info.ConfigureWindow)) {
				global.X.ConfigureWindow.apply(global.X, info.ConfigureWindow);
			}
			if (!_.isEqual(info0.visible, info.visible)) {
				if (info.visible)
					global.X.MapWindow(info.xid);
				else
					global.X.UnmapWindow(info.xid);
			}
			if (!_.isEqual(info0.focus, info.focus)) {
				if (info.focus)
					global.X.SetInputFocus(info.xid);
			}
			windowInfos[key] = info;
		}
	});

	// If no widget is focused, set focus to the root window of the current screen
	if (!state.hasOwnProperty('focusCurrentId')) {
		const xid = state.screens[state.screenCurrentId.toString()].xid;
		global.X.SetInputFocus(xid);
	}

	const keysMissing = _.difference(_.keys(windowInfosPrev), _.keys(windowInfos));
	for (let key of keysMissing) {
		const info = windowInfosPrev[key];
		global.X.DestroyWindow(info.xid);
	}
}

var airClientCreator = function(err, display) {
	initLogger('logs');
	logger.info("Initializing AirWM client.");
	// Set the connection to the X server in global namespace
	// as a hack since almost every file uses it
	global.X = display.client;

	const action1 = {
		type: 'initialize',
		desktops: [
			{
				name: "web",
				layout: "tile-right"
			}
		],
		screens: _.map(display.screen, (screen) => { return {
			xidRoot: screen.root,
			width: screen.pixel_width,
			height: screen.pixel_height
		}; })
	};
	console.log(action1);
	store.dispatch(action1);

	_.forEach(display.screen, (screen, i) => {
		screensX11.push({});
		global.X.AllocColor( screen.default_colormap, 0x5E00, 0x9D00, 0xC800, function(err, color) {
			store.dispatch({type: 'setX11ScreenColors', screenId: i, {focus: color.pixel});
		});
		global.X.AllocColor( screen.default_colormap, 0xDC00, 0xF000, 0xF700, function(err, color) {
			store.dispatch({type: 'setX11ScreenColors', screenId: i, {normal: color.pixel});
			screensX11[i].normal_color = color.pixel;
		});
		global.X.AllocColor( screen.default_colormap, 0x0C00, 0x2C00, 0x5200, function(err, color) {
			store.dispatch({type: 'setX11ScreenColors', screenId: i, {alert: color.pixel});
		});
	});


	const min_keycode = display.min_keycode;
	const max_keycode = display.max_keycode;
	X.GetKeyboardMapping(min_keycode, max_keycode-min_keycode, function(err, key_list) {
		ks2kc = conversion.buildKeyMap(key_list,min_keycode);

		// Grab all key combinations which are specified in the configuration file.
		grabKeyBindings(ks2kc,display);
	});

	ewmh = new EWMH(display.client, display.screen[0].root);

	const eventMask = {
		eventMask: x11.eventMask.SubstructureNotify   |
				   x11.eventMask.SubstructureRedirect |
				   x11.eventMask.ResizeRedirect
	}

	// By adding the substructure redirect you become the window manager.
	logger.info("Registering AirWM as the current Window Manager.");
	global.X.ChangeWindowAttributes(display.screen[0].root, eventMask, changeWindowAttributeErrorHandler);

	ewmh.on('CurrentDesktop', function(d) {
		console.log('Client requested current desktop to be: ' + d);
		//screens[0].setWorkspace(d);
	});

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

	ewmh.set_number_of_desktops(4, function(err) {
		if (err) {
			throw err;
		}
		ewmh.set_current_desktop(0);
	});

	store.subscribe(handleStateChange);

	// Load the programs that should get started and start them
	logger.info("Launching startup applications.");
	programs.forEach(execHandler);
}

x11.createClient(airClientCreator).on('error', errorHandler).on('event', eventHandler);
