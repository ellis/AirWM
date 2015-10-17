import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import checkList from '../checkList.js';
import reducer from '../../src/reducer.js';
import StateWrapper from '../../src/StateWrapper.js';
import * as ex from '../exampleStates.js';

describe('removeWindow', () => {
	const [d1, s1, w1, w2] = [0, 1, 2, 3];
	const action1 = {type: 'removeWindow', id: w1};
	const action2 = {type: 'removeWindow', id: w2};

	it('remove first window, focused window', () => {
		const state = reducer(ex.state112, action1);
		const builder = new StateWrapper(state);
		checkList(builder, undefined, [
			`widgetIdNext`, w2+1,
			`windowIdOrder`, [w2],
			`currentWindowId`, w2,
			`widgets.${d1}.childIdOrder`, [w2],
			`widgets.${d1}.childIdChain`, [w2],
		]);
	});

	it('handles removing last, unfocused widget', () => {
		const [d1, s1, w1, w2] = [0, 1, 2, 3];
		const state = reducer(ex.state112, action2);
		const expected = ex.state111.setIn(['widgetIdNext'], w2+1);
		//console.log(JSON.stringify(state.toJS(), null, '\t'));
		//console.log(diff(state, expected));
		expect(state).to.equal(expected);
	});

	it('handles removing last, focused widget', () => {
		const state1 = reducer(ex.state112, {type: 'activateWindow', id: w2});
		const state = reducer(state1, action2);
		//console.log(JSON.stringify(state.toJS(), null, '\t'));
		//console.log(diff(state, ex.state111));
		expect(state).to.equal(ex.state111.setIn(['widgetIdNext'], w2+1));
	});

	it('handles removing first, unfocused widget', () => {
		const state1 = reducer(ex.state112, {type: 'activateWindow', id: w2});
		const state = reducer(state1, action1);
		const builder = new StateWrapper(state);
		checkList(builder, undefined, [
			`windowIdOrder`, [w2],
			`currentWindowId`, w2,
			`widgets.${d1}.childIdOrder`, [w2],
			`widgets.${d1}.childIdChain`, [w2],
		]);
	});
});
