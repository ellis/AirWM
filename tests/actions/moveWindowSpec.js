import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import checkList from '../checkList.js';
import reducer from '../../src/reducer.js';
import StateWrapper from '../../src/StateWrapper.js';
import * as ex from '../exampleStates.js';

describe('moveWindowToDesktop', () => {
	it("works", () => {
		const [d1, d2, s1, dock1, w1, w2, w3] = [0, 1, 2, 3, 4, 5];
		let state = ex.state120;
		// Create three windows
		state = reducer(state, {type: 'addWindow', window: {type: 'window', xid: 1001}});
		state = reducer(state, {type: 'addWindow', window: {type: 'window', xid: 1002}});
		state = reducer(state, {type: 'addWindow', window: {type: 'window', xid: 1003}});
		// Move window 1 to desktop 2
		state = reducer(state, {type: 'moveWindowToDesktop', desktop: 1});

		{
			const builder = new StateWrapper(state);
			//builder.print();
			expect(builder.windowById(w1).parentId, "window 1's parent").to.equal(d2);
			// Don't follow the window
			expect(builder.currentWindowId, "currentWindowId").to.equal(w2);
		}

		// Move window 2 to desktop 2
		state = reducer(state, {type: 'moveWindowToDesktop', desktop: 1});

		{
			const builder = new StateWrapper(state);
			expect(builder.windowById(w2).parentId, "window 2's parent").to.equal(d2);
		}
	})
});
