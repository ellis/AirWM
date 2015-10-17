import {Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import makeStore from '../src/store.js';
import * as ex from './exampleStates.js';
import {initialState} from '../src/StateWrapper.js';

describe('store', () => {
	it('is a Redux store configured with the correct reducer', () => {
		const store = makeStore();
		expect(store.getState()).to.equal(initialState);

		const action1 = {
			type: 'initialize',
			desktops: [
				{
					name: "web",
					layout: "default"
				}
			],
			screens: [
				{
					xid: ex.screen0_xidRoot,
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
		const state = store.getState();
		//console.log(JSON.stringify(state, null, '\t'));
		//console.log(diff(state, ex.state110));
		expect(state).to.equal(ex.state110);
	});
});
