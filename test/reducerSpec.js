import {Map, fromJS} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../lib/reducer.js';
import * as ex from './exampleStates.js';

describe('reducer', () => {
	it('handles initialize', () => {
		const action = {
			type: 'initialize',
			desktops: [
				{
					name: "web",
					layout: "tile-right"
				}
			],
			screens: [
				{
					xidRoot: ex.screen0_xidRoot,
					width: 800,
					height: 600,
				}
			]
		};
		const state = reducer(undefined, action);
		expect(state).is.equal(ex.state110);
	});

	it('handles addWidget', () => {
		const action = {
			type: 'addWidget',
			widget: {
				xid: 1001
			}
		};
		const state1 = reducer(ex.state110, action);
		expect(state1).to.equal(ex.state111);
	});

	it('handles setFocusWidget', () => {
		const action1 = {
			type: 'setFocusWidget',
			id: 2
		};
		const state1 = reducer(ex.state112, action1);
		expect(state1.getIn(['focusCurrentId'])).to.equal(2);
		expect(state1.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
	});

	it('handles setX11ScreenColors', () => {
		const action1 = {
			type: 'setX11ScreenColors',
			screenId: 0,
			colors: {
				'a': 1,
				'b': 2
			}
		};
		const state1 = reducer(ex.state112, action1);
		expect(state1.getIn(['x11', 'screens', '0', 'colors', 'a'])).to.equal(1);
		expect(state1.getIn(['x11', 'screens', '0', 'colors', 'b'])).to.equal(2);
	});
});
