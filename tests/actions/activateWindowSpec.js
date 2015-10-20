import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import checkList from '../checkList.js';
import reducer from '../../src/reducer.js';
import StateWrapper from '../../src/StateWrapper.js';
import * as ex from '../exampleStates.js';

describe('activateWindow', () => {
	it('handles switch to second window', () => {
		const [d1, s1, w1, w2] = [0, 1, 2, 3];
		const state = reducer(ex.state112, {type: 'activateWindow', window: w2});
		const builder = new StateWrapper(state);
		checkList(builder, "activateWindow 2", [
			`currentWindowId`, w2,
			`widgets.${d1}.childIdOrder`, [w1, w2],
			`widgets.${d1}.childIdChain`, [w2, w1],
			`widgetIdChain`, [w2, d1, s1, w1],
		]);
	});
});

describe('activateWindowNext', () => {
	const action = {
		type: 'activateWindowNext'
	};
	it('handle situation with no windows (no change)', () => {
		const state1 = reducer(ex.state110, action);
		//console.log(diff(state1, ex.state110));
		expect(state1).to.deep.equal(ex.state110);
	});
	it('handle situation with single window (no change)', () => {
		const state1 = reducer(ex.state111, action);
		//new StateWrapper(state1).print();
		//console.log(diff(state1, ex.state111));
		expect(state1).to.equal(ex.state111);
	});
	it('handle situation with two windows', () => {
		const [d1, s1, w1, w2] = [0, 1, 2, 3];
		const state = reducer(ex.state112, action);
		//State.print(state)
		//console.log(diff(state, ex.state112));
		const builder = new StateWrapper(state);
		checkList(builder, "activateWindow 2", [
			`currentWindowId`, w2,
			`widgets.${d1}.childIdOrder`, [w1, w2],
			`widgets.${d1}.childIdChain`, [w2, w1],
			`widgetIdChain`, [w2, d1, s1, w1],
		]);
	});
	it('handle situation with two windows, called twice (no change)', () => {
		const state1 = reducer(ex.state112, action);
		const state2 = reducer(state1, action);
		//new StateWrapper(state2).print();
		//console.log(diff(state2, ex.state112));
		expect(state2).to.equal(ex.state112);
	});
});

describe('activateWindowPrev', () => {
	const action = {
		type: 'activateWindowPrev'
	};
	it('handle situation with no windows (no change)', () => {
		const state1 = reducer(ex.state110, action);
		expect(state1).to.equal(ex.state110);
	});
	it('handle situation with single window (no change)', () => {
		const state1 = reducer(ex.state111, action);
		expect(state1).to.equal(ex.state111);
	});
	it('handle situation with two windows', () => {
		const [d1, s1, w1, w2] = [0, 1, 2, 3];
		const state = reducer(ex.state112, action);
		const builder = new StateWrapper(state);
		checkList(builder, "activateWindow 2", [
			`currentWindowId`, w2,
			`widgets.${d1}.childIdOrder`, [w1, w2],
			`widgets.${d1}.childIdChain`, [w2, w1],
			`widgetIdChain`, [w2, d1, s1, w1],
		]);
	});
	it('handle situation with two windows, called twice (no change)', () => {
		const state1 = reducer(ex.state112, action);
		const state2 = reducer(state1, action);
		expect(state2).to.equal(ex.state112);
	});
});
