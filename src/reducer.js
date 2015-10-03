import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';
import Immutable from 'immutable';
import {logger} from '../lib/logger.js';

import * as core from './core.js';


export default function reducer(state = core.empty, action) {
	const handlers = {
		'@@redux/INIT': () => state,
		'activateDesktop': () => core.activateDesktop(state, action),
		'activateWindow': () => core.activateWindow(state, action),
		'activateWindowNext': () => core.activateWindowNext(state, action),
		'activateWindowPrev': () => core.focus_movePrev(state, action),
		'createWidget': () => core.createWidget(state, action),
		'destroyWidget': () => core.destroyWidget(state, action),
		'initialize': () => core.initialize(action.desktops, action.screens),
		//'move': () => core.move(state, action),
		'moveWindowToDesktop': () => core.moveWindowToDesktop(state, action),
		'setX11ScreenColors': () => core.setX11ScreenColors(state, action.screenId, action.colors)
	};
	const handler = handlers[action.type];
	if (handler) {
		return handler();
	}
	else {
		logger.warning("reducer: unknown action:")
		logger.warning(JSON.stringify(action));
		return state;
	}
}
