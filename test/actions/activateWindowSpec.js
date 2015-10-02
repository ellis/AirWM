import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../../src/reducer.js';
import State from '../../src/state.js';
import * as ex from '../exampleStates.js';

describe('activateWindow', () => {
	describe('activateWindowNext', () => {
		const action = {
			type: 'activateWindowNext'
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
			const state = reducer(ex.state112, action);
			expect(State.getCurrentWindowId(state)).to.equal(2);
			expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
		});
		it('handle situation with two windows, called twice (no change)', () => {
			const state1 = reducer(ex.state112, action);
			const state2 = reducer(state1, action);
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
			const state = reducer(ex.state112, action);
			expect(State.getCurrentWindowId(state)).to.equal(2);
			expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
		});
		it('handle situation with two windows, called twice (no change)', () => {
			const state1 = reducer(ex.state112, action);
			const state2 = reducer(state1, action);
			expect(state2).to.equal(ex.state112);
		});
	});

	it('handles activateWindow', () => {
		const state = reducer(ex.state112, {type: 'activateWindow', id: 2});
		expect(State.getCurrentWindowId(state)).to.equal(2);
		expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(1, 2));
		expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(2, 1));
		expect(state.getIn(['windowIdOrder'])).to.equal(List.of(1, 2));
		expect(state.getIn(['windowIdStack'])).to.equal(List.of(2, 1));
	});
});
