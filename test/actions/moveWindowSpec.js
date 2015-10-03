import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../../src/reducer.js';
import State from '../../src/state.js';
import * as ex from '../exampleStates.js';

describe('moveWindowToDesktop', () => {
	let state1, state2;
	before(() => {
		let state = ex.state120;
		// Create three windows
		state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1001}});
		state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1002}});
		state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1003}});
		// Move window 1 to desktop 2
		state = reducer(state, {type: 'moveWindowToDesktop', desktop: 1});
		state1 = state;
		// Move window 2 to desktop 2
		state = reducer(state, {type: 'activateDesktop', num: 0});
		state = reducer(state, {type: 'moveWindowToDesktop', desktop: 1});
		state2 = state;
	})
	it('moves window 1 to desktop 2', () => {
		const state = state1;
		expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(4, 5));
		expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(5, 4));
		expect(state.getIn(['widgets', '1', 'childIdOrder'])).to.equal(List.of(3));
		expect(state.getIn(['widgets', '1', 'childIdStack'])).to.equal(List.of(3));
		expect(state.getIn(['windowIdOrder'])).to.equal(List.of(3, 4, 5));
		expect(state.getIn(['windowIdStack'])).to.equal(List.of(3, 5, 4));
	});
	it('focuses window 1 on desktop 2', () => {
		expect(State.getCurrentWindowId(state1)).to.equal(3);
	});
	it('moves windows 1 & 2 to desktop 2', () => {
		const state = state2;
		expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(4));
		expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(4));
		expect(state.getIn(['widgets', '1', 'childIdOrder'])).to.equal(List.of(3, 5));
		expect(state.getIn(['widgets', '1', 'childIdStack'])).to.equal(List.of(5, 3));
		expect(state.getIn(['windowIdOrder'])).to.equal(List.of(3, 4, 5));
		expect(state.getIn(['windowIdStack'])).to.equal(List.of(5, 3, 4));
		expect(State.getCurrentWindowId(state)).to.equal(5);
	});
});
