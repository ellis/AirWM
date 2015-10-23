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
var logger = require('../lib/logger').logger;
import StateWrapper from './StateWrapper.js';
import makeStore from './store.js';
import getWindowProperties from '../lib/getWindowProperties.js';
import x11consts from './x11consts.js';

const store = makeStore();

// The workspaces currently available
let ewmh = undefined;

// The available key shortcuts that are known
var config	  = require("../config/config");
var programs	= config.startup_applications;
var keybindings = config.keybindings;
var ks2kc;

var clientCreator = function(err, display) {
	initLogger('logs');
	logger.info("Initializing WM client.");
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
				xid: screen.root,
				width: screen.pixel_width,
				height: screen.pixel_height
			}; })
		};
		store.dispatch(action1);

		_.forEach(display.screen, (screen, i) => {
			global.X.AllocColor(screen.default_colormap, 0x5E00, 0x9D00, 0xC800, function(err, color) {
				store.dispatch({type: 'setX11ScreenColors', screen: i, colors: {focus: color.pixel}});
			});
			global.X.AllocColor(screen.default_colormap, 0xDC00, 0xF000, 0xF700, function(err, color) {
				store.dispatch({type: 'setX11ScreenColors', screen: i, colors: {normal: color.pixel}});
			});
			global.X.AllocColor(screen.default_colormap, 0x0C00, 0x2C00, 0x5200, function(err, color) {
				store.dispatch({type: 'setX11ScreenColors', screen: i, colors: {alert: color.pixel}});
			});
			global.X.AllocColor(screen.default_colormap, 0xFF00, 0x8000, 0x8000, function(err, color) {
				store.dispatch({type: 'setX11ScreenColors', screen: i, colors: {floating: color.pixel}});
			});

			global.X.GrabButton(
				screen.root,
				0, // Don't report events to the window
				x11.eventMask.ButtonPress | x11.eventMask.ButtonRelease | x11.eventMask.ButtonMotion,
				1, // GrabModeAsync: async pointer mode
				1, // GrabModeAsync: async keyboard mode
				0, //confineTo,
				0, //cursor,
				1, // Button1
				64 + 4// alt (8) + ctrl (4) = 12, "windows" modifier = 64
			);

			global.X.GrabButton(
				screen.root,
				0, // Don't report events to the window
				x11.eventMask.ButtonPress | x11.eventMask.ButtonRelease | x11.eventMask.ButtonMotion,
				1, // GrabModeAsync: async pointer mode
				1, // GrabModeAsync: async keyboard mode
				0, //confineTo,
				0, //cursor,
				3, // Button3 (right button)
				64 + 4// alt (8) + ctrl (4) = 12, "windows" modifier = 64
			);
		});

		const min_keycode = display.min_keycode;
		const max_keycode = display.max_keycode;
		global.X.GetKeyboardMapping(min_keycode, max_keycode-min_keycode, function(err, key_list) {
			ks2kc = conversion.buildKeyMap(key_list,min_keycode);
			// Grab all key combinations which are specified in the configuration file.
			grabKeyBindings(ks2kc, display);
		});

		const eventMask = {
			eventMask:
				x11.eventMask.ButtonPress |
				x11.eventMask.EnterWindow |
				//x11.eventMask.LeaveWindow |
				x11.eventMask.SubstructureNotify |
				x11.eventMask.SubstructureRedirect |
				//x11.eventMask.StructureNotify |
				x11.eventMask.PointerMotion |
				x11.eventMask.PropertyChange |
				x11.eventMask.ResizeRedirect
		};

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
			//'_NET_SUPPORTING_WM_CHECK',
			//'_NET_WM_NAME',
			//'_NET_WM_STRUT',
			'_NET_WM_STATE',
			//'_NET_WM_STATE_FULLSCREEN',
			'_NET_WM_STATE_MODAL',
			'_NET_WM_STRUT_PARTIAL',
			'_NET_WM_WINDOW_TYPE',
			'_NET_WM_WINDOW_TYPE_DESKTOP',
			'_NET_WM_WINDOW_TYPE_DIALOG',
			'_NET_WM_WINDOW_TYPE_DOCK',
			// _NET_WM_WINDOW_TYPE_TOOLBAR, _NET_WM_WINDOW_TYPE_MENU, _NET_WM_WINDOW_TYPE_UTILITY, _NET_WM_WINDOW_TYPE_SPLASH, _NET_WM_WINDOW_TYPE_DROPDOWN_MENU, _NET_WM_WINDOW_TYPE_POPUP_MENU, _NET_WM_WINDOW_TYPE_TOOLTIP, _NET_WM_WINDOW_TYPE_NOTIFICATION, _NET_WM_WINDOW_TYPE_COMBO, _NET_WM_WINDOW_TYPE_DND,
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
		logger.error("clientCreator: ERROR:")
		logger.error(e.message);
		logger.error(e.stack);
	}
}

var changeWindowAttributeErrorHandler = function(err) {
	if( err.error === 10 ) {
		logger.error("Another Window Manager is already running -- flowmo will now terminate.");
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

let eventQueue = [];
let eventHandlerRunning = false;
function enqueueEvent(ev) {
	// Avoid piling up MotionNotify events
	if (ev.name === 'MotionNotify' && eventQueue.length > 0 && _.last(eventQueue).name === 'MotionNotify') {
		eventQueue[eventQueue.length - 1] = ev;
	}
	// All other events: put them at the back of the queue
	else {
		eventQueue.push(ev);
	}
	if (!eventHandlerRunning)
		handleEvent();
}

const eventHandlers = {
	'ButtonPress': handleButtonPress,
	'ButtonRelease': handleButtonRelease,
	'ClientMessage': handleClientMessage,
	"ConfigureRequest": handleConfigureRequest,
	"DestroyNotify": handleDestroyNotify,
	"EnterNotify": handleEnterNotify,
	//case "LeaveNotify":
	'KeyPress': handleKeyPress,
	// Show a window
	'MapRequest': handleMapRequest,
	'MotionNotify': handleMotionNotify,
	'UnmapNotify': handleUnmapNotify,
};

let eventNamePrev = undefined;
function handleEvent() {
	eventHandlerRunning = true;
	const ev = eventQueue.shift();

	try {
		let id = undefined;
		if (ev.wid)
			id = findWidgetIdForXid(ev.wid);
		// Only log first of sequential MotionNotify events
		if (ev.name !== "MotionNotify" || eventNamePrev !== "MotionNotify") {
			const idText = (id >= 0)
				? "@"+id
				: (ev.wid >= 0)
					//? "@ 0x"+ev.wid.toString(16)
					? "#"+ev.wid
					: "undefined";
			logger.info(`event ${idText} ${ev.name}`);//`: ${JSON.stringify(ev)}`);
			if (id === 6)
				console.log(_.omit(ev, 'rawData'));
		}
		eventNamePrev = ev.name;

		const handler = _.get(eventHandlers, ev.name);
		//if (!handler) console.log("unhandled event")
		const promise = (handler) ? handler(ev, id) : Promise.resolve();
		promise.then(() => {
			if (eventQueue.length > 0) {
				return handleEvent();
			}
			else {
				eventHandlerRunning = false;
				return Promise.resolve();
			}
		}).catch(err => {
			logger.error("handleEvent: "+JSON.stringify(ev));
			logger.error(e.message);
			logger.error(e.stack);
			if (eventQueue.length > 0) {
				return handleEvent();
			}
			else {
				eventHandlerRunning = false;
				return Promise.resolve();
			}
		});
	}
	catch (e) {
		logger.error("handleEvent: "+JSON.stringify(ev));
		logger.error(e.message);
		logger.error(e.stack);
	}
}

let dragStart = null;

function handleButtonPress(ev, id) {
	id = findWidgetIdForXid(ev.child);
	console.log("handleButtonPress: "+id+" "+JSON.stringify(ev));
	if (id >= 0) {
		const builder = new StateWrapper(store.getState());
		const w = builder.windowById(id);
		if ((ev.buttons & 68) === 68 && w.flagFloating && (ev.keycode === 1 || ev.keycode === 3)) {
			dragStart = {
				id,
				rc: w.getRc().toJS(),
				rootx: ev.rootx,
				rooty: ev.rooty,
				keycode: ev.keycode
			};
		}
		store.dispatch({type: "activateWindow", window: id});
	}
	return Promise.resolve();
}

function handleMotionNotify(ev) {
	if (dragStart) {
		console.log({dragStart, ev});
		const dx = ev.rootx - dragStart.rootx;
		const dy = ev.rooty - dragStart.rooty;
		const rc = dragStart.rc;
		// Drag
		if (dragStart.keycode === 1) {
			const pos = [rc[0] + dx, rc[1] + dy];
			store.dispatch({type: 'setWindowRequestedProperties', window: dragStart.id, props: {pos}});
		}
		// Resize
		else {
			const size = [rc[2] + dx, rc[3] + dy];
			store.dispatch({type: 'setWindowRequestedProperties', window: dragStart.id, props: {size}});
		}
	}
	return Promise.resolve();
}

function handleButtonRelease(ev) {
	dragStart = null;
	return Promise.resolve();
}

function handleClientMessage(ev) {
	return new Promise((resolve, reject) => {
		global.X.GetAtomName(ev.type, function(err, name) {
			if (err) return reject(err);

			logger.info("handleClientMessage: "+name+" "+JSON.stringify(_.omit(ev, 'rawData')));
			switch (name) {
			case '_NET_ACTIVE_WINDOW': {
				const id = findWidgetIdForXid(ev.wid);
				if (id >= 0) {
					store.dispatch({type: 'activateWindow', window: id});
				}
				break;
			}
			case '_NET_CLOSE_WINDOW':
				return handleDestroyNotify(ev);

			case '_NET_CURRENT_DESKTOP':
				store.dispatch({type: 'activateDesktop', desktop: ev.data[0]});
				break;

			case '_NET_WM_DESKTOP':
				// FIXME: need to use ev.wid rather than assuming that this is for the current window
				store.dispatch({type: 'moveWindowToDesktop', desktop: ev.data[0]});
				break;
			}

			resolve();
		});
	});
}

function handleConfigureRequest(ev, id) {
	let {width, height} = ev;

	if (id >= 0) {
		const state = store.getState();
		const builder = new StateWrapper(state);
		const window = builder.windowById(id);
		const ConfigureWindow = state.getIn(['x11', 'windowSettings', id.toString(), 'ConfigureWindow']);
		// This should be changed to allow them on floating windows.
		if (window.flagFloating) {
			const borderWidth = 5;
			store.dispatch({type: 'setWindowRequestedProperties', props: {
				size: [ev.width + 2*borderWidth, ev.height + 2*borderWidth],
				pos: [ev.x - borderWidth, ev.y - borderWidth]
			}});
		}
		// Ignore request for other known windows
		else if (ConfigureWindow) {
			width = ConfigureWindow.getIn([1, 'width']);
			height = ConfigureWindow.getIn([1, 'height']);
			//return Promise.resolve();
		}
	}

	// Allow requested resize for optimization. Window gets resized
	// automatically by WM again anyway.
	console.log({id, wid: ev.wid, width0: ev.width, height0: ev.height, width, height})
	// HACK: I'm not sure why, but we need to resize twice in order for some
	// windows to paint themselves correctly: first to the requested size, then
	// to the desired size.
	X.ResizeWindow(ev.wid, ev.width, ev.height);
	if (id >= 0)
		X.ResizeWindow(ev.wid, width, height);
	return Promise.resolve();
}

function handleDestroyNotify(ev) {
	const id = findWidgetIdForXid(ev.wid);
	if (id >= 0) {
		store.dispatch({type: 'removeWindow', window: id});
	}
	return Promise.resolve();
}

/**
 * This event handler is responsible "focus follows mouse".
 * Unfortunately, the implementation is complicated.
 * The EnterNotify event is sent whenever the mouse "enters" a window,
 * but that may occur when windows are moved or opened, or the desktop
 * is switched.
 * However, focus-follows-mouse should only occur in response to the
 * MOVEMENT of the mouse cursor into a new window.
 *
 * In order to address this problem, I use a buggy hack:
 * - in handleStateChange(), after the active window changes, set ignoreEnterNotify = true.
 * - This will lead ignoring one EnterNotify event (the next one).
 * - Also check the coordinates of the last EnterNotify event, and
 *   ignore if the coordinates haven't changed.
 * - set ignoreEnterNotify=false at end of handleEnterNotify(),
 *
 * Solves:
 * - when the user switches desktops, the window under the mouse
 *   doesn't get automatically selected.
 * - when user moves windows around the layout with shortcut keys.
 *
 * Doesn't solve:
 * - This strategy won't handle
 *   the case of a new window opening, where we also shouldn't automatically
 *   switch to the window under the cursor!
 * - Layout changes that lead to a different window being under the cursor.
 * - when the user uses shortcuts to activate a window, the next time the mouse
 *   moves to a new window, EnterNotify might be ignored.
 *
 * Possible better solutions:
 * 1. set ignoreEnterNotify=true whenever there is a layout change, and use
 *    a timer to limit how long EnterNotify will be ignored.
 * 2. use XInput to detect mouse movement, and only use EnterNotify it's for
 *    the window that was under the last mouse movement.
 */
let handleEnterNotifyCoordsPrev = {};
let ignoreEnterNotify = true;
function handleEnterNotify(ev, id) {
	const coords = _.pick(ev, ['rootx', 'rooty']);
	let state = store.getState();
	//_focusId = id;
	if (id >= 0) {
		//console.log({coords, ev, handleEnterNotifyCoordsPrev});
		if (!ignoreEnterNotify && !_.isEqual(coords, handleEnterNotifyCoordsPrev)) {
			store.dispatch({type: 'activateWindow', window: id});
		}
		else {
			//console.log("ignored EnterNotify");
		}
		ignoreEnterNotify = false;
		//console.log("ignoreEnterNotify = false")
	}
	handleEnterNotifyCoordsPrev = coords;
	return Promise.resolve();
}

function handleKeyPress(ev){
	//console.log(ev)
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
	return Promise.resolve();
}

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

/**
 * Decides whether to manage the given window when the WM starts.
 *
 * - If the `overrideRedirect` attribute is set, don't manage.
 * - If the `mapState` attribute is 'viewable', manage.
 * - If the `WM_STATE` property is 'iconified', manage.
 * - If the `_NET_WM_DESKTOP` property is set, manage.
 * - Otherwise, don't manage
 * @param  {number} xid - X11 window ID
 */
function handlePreExistingWindow(xid) {
	console.log("handlePreExistingWindow: "+xid)
	global.X.GetWindowAttributes(xid, function(err, attrs) {
		logger.info(`handlePreExistingWindow(${xid})`);
		if (err) {
			promiseCatcher(e);
			return;
		}
		console.log(attrs);

		// If the override-redirect flag is set, don't manage:
		if (attrs.overrideRedirect) {
			logger.info("window has overrideRedirect");
		}
		else {
			getWindowProperties(global.X, xid).then(props => {
				const isVisible = (attrs.mapState === x11consts.WA_MapState_IsViewable);
				const isIconified = (props['WM_STATE'] === x11consts.WM_STATE_IconicState);
				const hasDesktop = (props['_NET_WM_DESKTOP'] >= 0);

				if (isVisible || isIconified || hasDesktop) {
					createWidgetForXid(xid, props);
				}
				else {
					logger.info("window isn't visible: "+JSON.stringify({isVisible, isIconified, hasDesktop}));
				}
			});
		}
	});
}

function promiseCatcher(e) {
	logger.error(e);
	logger.error(e.message);
	logger.error(e.stack);
}

function handleMapRequest(ev, id) {
	// ignore request for already existing windows
	if (id >= 0) {
		return Promise.resolve();
	}

	const xid = ev.wid;
	let log = `handleMapRequest(${xid})`;
	const p1 = new Promise((resolve, reject) => {
		global.X.GetWindowAttributes(xid, function(err, attrs) {
			if (err) return reject(err);
			return resolve(attrs);
		});
	});
	const p2 = p1.then(attrs => {
		// If the override-redirect flag is set, don't manage, just show:
		if (attrs.overrideRedirect) {
			logger.info(log+": window has overrideRedirect");
			X.MapWindow(xid);
			return Promise.resolve();
		}
		else {
			return getWindowProperties(global.X, xid).then(props => {
				console.log({id, xid, ev: _.omit(ev, 'rawData'), attrs})
				createWidgetForXid(xid, props);
				return Promise.resolve();
			});
		}
	});
	return p2;
}

function createWidgetForXid(xid, props) {
	logger.info(`createWidgetForXid(${xid})`);
	console.log(_.omit(props, '_NET_WM_ICON'));
	const hints = {
		windowType: _.get(props, '_NET_WM_WINDOW_TYPE[0]'),
		state: _.get(props, '_NET_WM_STATE[0]'),
		transientForXid: _.get(props, 'WM_TRANSIENT_FOR[0]')
	};
	console.log({hints})
	const widgetType = _.get(
		{
			'_NET_WM_WINDOW_TYPE_DOCK': 'dock',
			'_NET_WM_WINDOW_TYPE_DESKTOP': 'background',
			//'_NET_WM_WINDOW_TYPE_DESKTOP': 'window',
		},
		hints.windowType,
		'window'
	);

	const action = {
		type: 'attachWindow',
		window: {
			type: widgetType,
			xid
		}
	};

	if (widgetType === 'dock') {
		let [left, right, top, bottom, left_start_y, left_end_y, right_start_y, right_end_y, top_start_x, top_end_x, bottom_start_x, bottom_end_x] = props["_NET_WM_STRUT_PARTIAL"];
		//console.log("addXwinDock: "+props["_NET_WM_STRUT_PARTIAL"]);
		//console.log([left, right, top, bottom]);
		if (top > 0) {
			action.window.dockGravity = "top";
			action.window.dockSize = top;
		}
		else if (bottom > 0) {
			action.window.dockGravity = "bottom";
			action.window.dockSize = bottom;
		}
	}

	if (hints.transientForXid > 0) {
		const transientForId = findWidgetIdForXid(hints.transientForXid);
		console.log({transientForId})
		if (transientForId >= 0) {
			action.window.transientForId = transientForId;
		}
	}

	if (hints.state === '_NET_WM_STATE_MODAL') {
		_.set(action.window, 'flags.floating', true);
	}

	store.dispatch(action);
}

/*function handleLeaveNotify(ev) {
	const coords = _.pick(ev, ['rootx', 'rooty']);
	//console.log({coords, ev, handleEnterNotifyCoordsPrev});
	handleEnterNotifyCoordsPrev = coords;
}*/

function handleUnmapNotify(ev, id) {
	if (id >= 0) {
		const builder = new StateWrapper(store.getState());
		const w = builder.windowById(id);
		if (w) {
			if (w.visible) {
				store.dispatch({type: 'detachWindow', window: id});
			}
		}
	}
	return Promise.resolve();
}

//creates the logDir directory when it doesn't exist (otherwise Winston fails)
function initLogger(logDir) {
	if(!fs.existsSync(logDir))
		fs.mkdirSync(logDir);
}

let statePrev = Map();
function handleStateChange() {
	try {
		const state = store.getState();
		const builder = new StateWrapper(state);
		fs.writeFileSync('state.json', JSON.stringify(state.toJS(), null, '\t'));
		//builder.print();
		// If the active window has changed, set ignoreEnterNotify = true
		if (state.getIn(['x11', 'wmSettings', 'ewmh', '_NET_ACTIVE_WINDOW', 0]) !== statePrev.getIn(['x11', 'wmSettings', 'ewmh', '_NET_ACTIVE_WINDOW', 0])) {
			//console.log("ignoreEnterNotify = true")
			ignoreEnterNotify = true;
		}
		// Settings for each window
		let windowSettingsPrev = statePrev.getIn(['x11', 'windowSettings'], Map());
		const windowIdStack = state.getIn(['windowIdStack'], List());
		windowIdStack.forEach(id => {
			const key = id.toString();
			const settings1 = state.getIn(['x11', 'windowSettings', key], Map());
			windowSettingsPrev = windowSettingsPrev.delete(key);
			const settings0 = statePrev.getIn(['x11', 'windowSettings', key], Map());
			const xid = settings1.get('xid');

			/*// If window is new:
			if (!statePrev.hasIn(['widgets', key])) {
				global.X.GrabButton(
					xid,
					0, // Don't report events to the window
					x11.eventMask.ButtonPress | x11.eventMask.ButtonRelease | x11.eventMask.ButtonMotion,
					1, // GrabModeAsync: async pointer mode
					1, // GrabModeAsync: async keyboard mode
					0, //confineTo,
					0, //cursor,
					1, // Button1
					64 + 4// alt (8) + ctrl (4) = 12, "windows" modifier = 64
				);
			}*/

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
				console.log({ConfigureWindow})
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
			const screen = builder.currentScreen;
			const xid = screen.xid;
			state.getIn(['x11', 'wmSettings', 'ewmh']).forEach((value, name) => {
				if (value !== statePrev.getIn(['x11', 'wmSettings', 'ewmh', name])) {
					const value2 = Map({value}).toJS().value;
					handleEwmh(xid, name, value2);
				}
			});
		}

		statePrev = state;

		// Delete windows that have been removed
		windowSettingsPrev.forEach((settings, key) => {
			const id = parseInt(key);
			const window = builder.windowById(id);
			if (window) {
				if (window._get(['flags', 'closing'], false) === true) {
					const xid = settings.get('xid');
					global.X.DestroyWindow(xid);
				}
				store.dispatch({type: 'removeWindow', id});
			}
		});
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


x11.createClient({debug: true}, clientCreator).on('error', errorHandler).on('event', enqueueEvent);
