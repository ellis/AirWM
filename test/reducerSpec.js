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
});
