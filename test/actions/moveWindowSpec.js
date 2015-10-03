import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../../src/reducer.js';
import State from '../../src/state.js';
import * as ex from '../exampleStates.js';

describe('moveWindowToDesktop', () => {
	let state;
	before(() => {
		state = ex.state120;
		state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1001}});
		state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1002}});
		state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1003}});
		state = reducer(state, {type: 'moveWindowToDesktop', desktop: 1});
	})
	it('moves window 1 to desktop 2', () => {
		expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(4, 5));
		expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(5, 4));
		expect(state.getIn(['widgets', '1', 'childIdOrder'])).to.equal(List.of(3));
		expect(state.getIn(['widgets', '1', 'childIdStack'])).to.equal(List.of(3));
		expect(state.getIn(['windowIdOrder'])).to.equal(List.of(3, 4, 5));
		expect(state.getIn(['windowIdStack'])).to.equal(List.of(3, 5, 4));
	});
	it('focuses window 1 on desktop 2', () => {
		expect(State.getCurrentWindowId(state)).to.equal(3);
	});
});
