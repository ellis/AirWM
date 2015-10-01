import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';
import Immutable from 'immutable';
import {logger} from '../lib/logger.js';

import * as core from './core.js';


export default function reducer(state = core.empty, action) {
	switch (action.type) {
		case '@@redux/INIT':
			// do nothing
			break;
		case 'desktop.raise':
			return core.desktop_raise(state, action);
		case 'initialize':
			return core.initialize(action.desktops, action.screens);
		case 'focus.moveNext':
			return core.focus_moveNext(state, action);
		case 'focus.movePrev':
			return core.focus_movePrev(state, action);
		case 'focus.moveTo':
			return core.focus_moveTo(state, action);
		case 'widget.add':
			return core.widget_add(state, action);
		case 'widget.remove':
			return core.widget_remove(state, action);
		case 'setX11ScreenColors':
			return core.setX11ScreenColors(state, action.screenId, action.colors);
		default:
			logger.error("reducer: unknown action:")
			logger.error(JSON.stringify(action));
	}
	return state;
}
