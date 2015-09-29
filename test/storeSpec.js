import {Map, fromJS} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import makeStore from '../lib/store.js';
import * as ex from './exampleStates.js';
import {empty} from '../lib/core.js';

describe('store', () => {
	it('is a Redux store configured with the correct reducer', () => {
		const store = makeStore();
		expect(store.getState()).to.equal(empty);

		const action1 = {
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
		/*const action2 = {
			type: 'addWidget',
			widget: {
				xid: 1001
			}
		};*/

		store.dispatch(action1);
		expect(store.getState()).to.equal(ex.state110);
	});
});
