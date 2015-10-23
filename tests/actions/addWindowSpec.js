import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import checkList from '../checkList.js';
import reducer from '../../src/reducer.js';
import StateWrapper from '../../src/StateWrapper.js';
import * as ex from '../exampleStates.js';

const action1 = {
	type: 'attachWindow',
	window: {
		type: 'window',
		xid: 1001
	}
};

const action2 = {
	type: 'attachWindow',
	window: {
		type: 'window',
		xid: 1002
	}
};

describe('attachWindow', () => {
	let state1, state2;
	before(() => {
		state1 = reducer(ex.state110, action1);

		state2 = reducer(state1, action2);
	});

	it('adding first window', () => {
		const [d1, s1, w1] = [0, 1, 2];
		const state = reducer(ex.state110, action1);
		const builder = new StateWrapper(state);
		checkList(builder, "should increment widgetIdNext", [
			`widgetIdNext`, w1+1,
		]);
		checkList(builder, "should set focus to that window", [
			`currentWindowId`, w1,
			`widgetIdChain`, [w1, d1, s1],
			`x11.wmSettings.SetInputFocus[0]`, action1.window.xid,
		]);
		checkList(builder, "should add window to the current desktop", [
			`widgets.${d1}.childIdOrder`, [w1],
			`widgets.${d1}.childIdChain`, [w1],
			`widgets.${w1}.parentId`, d1,
			`x11.windowSettings.${w1}.desktopNum`, 0,
		]);
		checkList(builder, "should make the window visible", [
			`widgets.${w1}.visible`, true,
		]);
		// should equal fully specified state
		//builder.print();
		//console.log(diff(state, ex.state111));
		expect(state).to.equal(ex.state111);
	});

	it('adding second window', () => {
		const [d1, s1, w1, w2] = [0, 1, 2, 3];
		const state1 = reducer(ex.state110, action1);
		const state = reducer(state1, action2);
		const builder = new StateWrapper(state);
		checkList(builder, "should leave the focus on the first window", () => [
			`currentWindowId`, w1,
			`widgetIdChain`, [w1, d1, s1, w2],
			`x11.wmSettings.SetInputFocus[0]`, action1.window.xid,
		]);
		checkList(builder, 'should add window to the current desktop', () => [
			`widgets.${d1}.childIdOrder`, List.of(w1, s2),
			`widgets.${w2}.parentId`, d1,
			`x11.windowSettings.${w2}.desktopNum`, 0,
		]);
		checkList(builder, "should make the window visible", [
			`widgets.${w2}.visible`, true,
		]);
		// should equal fully specified state
		//builder.print();
		//console.log(diff(state, ex.state112));
		expect(state).to.equal(ex.state112);
	});

	it('adding three windows', () => {
		const [d1, s1, w1, w2, w3] = [0, 1, 2, 3, 4];
		let state = ex.state120;
		state = reducer(state, {type: 'attachWindow', window: {type: 'window', xid: 1001}});
		state = reducer(state, {type: 'attachWindow', window: {type: 'window', xid: 1002}});
		state = reducer(state, {type: 'attachWindow', window: {type: 'window', xid: 1003}});
		const builder = new StateWrapper(state);
		checkList(builder, 'it should have the propert stack order', () => [
			`widgets.${d1}.childIdOrder`, List.of(w1, w2, w3),
			`widgets.${d1}.childIdChain`, List.of(w1, w2, w3),
			`windowIdOrder`, [w1, w2, w3],
		]);
	});

	it('removing first window, then adding a thrid', () => {
		const [d1, s1, w1, w2, w3] = [0, 1, 2, 3, 4];
		const state1 = reducer(ex.state112, {type: 'removeWindow', window: w1});
		const state = reducer(state, {type: 'attachWindow', window: {type: 'window', xid: 1003}});
		const builder = new StateWrapper(state);
		checkList(builder, undefined, () => [
			`widgetIdNext`, 5,
			`currentWindowId`, w2,
			`widgets.${d1}.childIdOrder`, List.of(w2, w3),
			`widgets.${d1}.childIdChain`, List.of(w2, w3),
			`windowIdOrder`, [w1, w3],
		]);
	});
});
