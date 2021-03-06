// External libraries
import _ from 'lodash';
var fs	 = require("fs");
import EWMH from 'ewmh';
var x11	= require('x11');
var exec   = require('child_process').exec;
var keysym = require('keysym');

// Custom libraries
var conversion = require('./conversion');
var logger	 = require('./logger').logger;
//import getWindowProperties from './getWindowProperties.js';
// Load the objects
import Container from './objects/Container.js';
import Frame from './objects/Frame.js';
import Screen from './objects/screen.js';
import Workspace from './objects/Workspace.js';

// The workspaces currently available
let ewmh = undefined;
let screens = [];
let workspaces = [];

// The available key shortcuts that are known
var config	  = require("../config/config");
var programs	= config.startup_applications
var keybindings = config.keybindings
var ks2kc;

function forEachWindow(fn) {
	//console.log("forEachWindow: "+workspaces)
	workspaces.forEach(spc => { spc.forEachWindow(fn); });
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

var closeAllWindows = function(close_id) {
	logger.info("Closing all windows.");
	for (let screen of screens){
		screen.closeAllWindows();
	}
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
		case "CloseWindow":
			if( global.focus_window !== null ) {
				global.focus_window.destroy();
				var w = null;
				forEachWindow(function(window) {
					w = window;
				});
				if( w !== null ) w.focus();

				setFocusToRootIfNecessary();
			}
			break;
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

var mapRequestHandler = function(ev){
	screens[0].addXwin(ev.wid);
	const xids = _(workspaces).map(spc => { return spc.getWindowList() }).flatten().pluck('xid').compact().value();
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
			forEachWindow(function(window) {
				console.log({xid: window.xid, wid: ev.wid });
				if( window.xid === ev.wid ) {
					window.focus();
				}
			});
			break;
		case "KeyPress":
			keyPressHandler(ev);
			break;
		default:
			//logger.error("Unhandled event: "+ev.name);
		}
	}
	catch (e) {
		logger.error("eventHandler:")
		logger.error(JSON.stringify(e));
		logger.error(e.message);
		logger.error(e.stack);
		console.trace();
	}
}

//creates the logDir directory when it doesn't exist (otherwise Winston fails)
var initLogger = function (logDir){
	if(!fs.existsSync(logDir))
		fs.mkdirSync(logDir);
}

var airClientCreator = function(err, display) {
	initLogger('logs');
	logger.info("Initializing AirWM client.");
	// Set the connection to the X server in global namespace
	// as a hack since almost every file uses it
	global.X = display.client;

	// Set the focussed window to null
	global.focus_window = null;

	const min_keycode = display.min_keycode;
	const max_keycode = display.max_keycode;
	X.GetKeyboardMapping(min_keycode, max_keycode-min_keycode, function(err, key_list) {
		ks2kc = conversion.buildKeyMap(key_list,min_keycode);

		// Grab all key combinations which are specified in the configuration file.
		grabKeyBindings(ks2kc,display);
	});

	// Create the workspaces object
	logger.debug("Creating workspaces.");
	//logger.info("display.screen: "+JSON.stringify(display.screen));
	workspaces = _.times(10, () => { return new Workspace(); });
	logger.debug("Creating screens.");
	screens = _.map(display.screen, (screen) => { return new Screen(screen, workspaces); });
	ewmh = new EWMH(display.client, display.screen[0].root);

	const eventMask = {
		eventMask: x11.eventMask.SubstructureNotify   |
				   x11.eventMask.SubstructureRedirect |
				   x11.eventMask.ResizeRedirect
	}

	// By adding the substructure redirect you become the window manager.
	logger.info("Registering AirWM as the current Window Manager.");
	global.X.ChangeWindowAttributes(display.screen[0].root,eventMask,changeWindowAttributeErrorHandler);

	ewmh.on('CurrentDesktop', function(d) {
		console.log('Client requested current desktop to be: ' + d);
		screens[0].setWorkspace(d);
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

	// Load the programs that should get started and start them
	logger.info("Launching startup applications.");
	programs.forEach(execHandler);
}

x11.createClient(airClientCreator).on('error', errorHandler).on('event', eventHandler);
