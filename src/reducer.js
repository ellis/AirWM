import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';
import Immutable from 'immutable';
import {logger} from '../lib/logger.js';

import StateWrapper, {initialState} from './StateWrapper.js';
import updateLayout from '../src/updateLayout.js';
import updateX11 from '../src/updateX11.js';

const handlers = {
	'@@redux/INIT': () => {},

	'activateDesktop': (builder, action) => {
		const desktopId = builder.findDesktopIdByNum(action.desktop);
		builder.activateDesktop(desktopId);
	},

	'activateWindow': (builder, action) => {
		builder.activateWindow(action.window);
	},

	'activateWindowNext': (builder, action) => {
		builder.activateWindowNext();
	},

	'activateWindowPrev': (builder, action) => {
		builder.activateWindowPrev();
	},

	'attachWindow': (builder, action) => {
		//console.log({action})
		builder.attachWindow(action.window);
		//console.log("after attachWindow:")
		//builder.print();
	},

	'closeWindow': (builder, action) => {
		builder.closeWindow();
	},

	'detachWindow': (builder, action) => {
		builder.detachWindow(action.window);
	},

	'removeWindow': (builder, action) => {
		builder.removeWindow(action.window);
	},

	'initialize': (builder, action) => {
		builder.state = initialState;
		for (const desktop of action.desktops) {
			builder.addDesktop(desktop);
		}
		for (const screen of action.screens) {
			builder.addScreen(screen);
		}
	},

	//'move': () => core.move(state, action),
	'moveWindowToDesktop': (builder, action) => {
		const desktopId = builder.findDesktopIdByNum(action.desktop);
		builder.moveWindowToDesktop(undefined, desktopId);
	},

	'moveWindowToIndexNext': (builder, action) => {
		builder.moveWindowToIndexNext();
	},

	'moveWindowToIndexPrev': (builder, action) => {
		builder.moveWindowToIndexPrev();
	},

	'setX11ScreenColors': (builder, action) => {
		const screenId = builder.findScreenIdByNum(action.screen);
		builder.state = builder.state.mergeIn(['x11', 'screens', screenId.toString(), 'colors'], Map(action.colors));
	},

	'toggleWindowFloating': (builder, action) => {
		builder.toggleWindowFloating();
	},

	'setWindowRequestedProperties': (builder, action) => {
		builder.setWindowRequestedProperties(action.window, action.props);
	},
};

export default function reducer(state = initialState, action) {
	logger.info("reducer: "+JSON.stringify(action));

	const handler = handlers[action.type];
	if (handler) {
		try {
			const builder = new StateWrapper(state);
			builder.check();
			handler(builder, action);
			updateLayout(builder);
			updateX11(builder);
			builder.check();
			return builder.getState();
		}
		catch (e) {
			logger.error(e.message);
			logger.error(e.stack);
		}
	}

	else {
		logger.warn("reducer: unknown action", action);
	}
	return state;
}
