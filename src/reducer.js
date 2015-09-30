import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';
import Immutable from 'immutable';

import * as core from './core.js';


export default function reducer(state = core.empty, action) {
	switch (action.type) {
		case 'initialize':
			return core.initialize(action.desktops, action.screens);
		case 'addWidget':
			return core.addWidget(state, action.widget);
		case 'setFocusWidget':
			return core.setFocusWidget(state, action.id);
		case 'setX11ScreenColors':
			return core.setX11ScreenColors(state, action.screenId, action.colors);
	}
	return state;
}
