// External libraries
import _ from 'lodash';
var fs = require("fs");
var x11 = require('x11');
var exec   = require('child_process').exec;
var keysym = require('keysym');

// Custom libraries
var conversion = require('../lib/conversion');
var logger = require('../lib/logger').logger;

// The available key shortcuts that are known
var config = require("../config/config");
var programs = ['xterm'];
var keybindings = config.keybindings;
var ks2kc;

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

var commandHandler = function(command) {
	logger.info("Launching airwm-command: '%s'.", command);
	try {
		if (!_.isArray(command))
			command = [command];
		switch(command[0]){
			case "Shutdown":
				//closeAllWindows();
				process.exit(0);
				break;
			case "CloseWindow": {
				break;
			}
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
			}
		}
	}
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
			global.X.MapWindow(ev.wid);
			break;
		case "DestroyNotify":
			break;
		case "EnterNotify":
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

//creates the logDir directory when it doesn't exist (otherwise Winston fails)
function initLogger(logDir) {
	if(!fs.existsSync(logDir))
		fs.mkdirSync(logDir);
}

function clientCreator(err, display) {
	initLogger('logs');
	logger.info("Initializing AirWM client.");
	try {
		// Set the connection to the X server in global namespace
		// as a hack since almost every file uses it
		global.X = display.client;

		const min_keycode = display.min_keycode;
		const max_keycode = display.max_keycode;
		global.X.GetKeyboardMapping(min_keycode, max_keycode-min_keycode, function(err, key_list) {
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
		logger.info("Registering AirWM as the current Window Manager.");
		global.X.ChangeWindowAttributes(display.screen[0].root, eventMask, changeWindowAttributeErrorHandler);

		// Load the programs that should get started and start them
		logger.info("Launching startup applications.");
		programs.forEach(execHandler);
	}
	catch (e) {
		logger.error("clientCreator: ERROR:")
		logger.error(e.message);
		logger.error(e.stack());
	}
}

x11.createClient(clientCreator).on('error', errorHandler).on('event', eventHandler);
