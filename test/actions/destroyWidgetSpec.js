import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../../src/reducer.js';
import State from '../../src/state.js';
import * as ex from '../exampleStates.js';

describe('destroyWidget', () => {
	const action1 = {type: 'destroyWidget', id: 1};
	const action2 = {type: 'destroyWidget', id: 2};
	describe('remove first window, focused window', () => {
		let state;
		before(() => {
			state = reducer(ex.state112, action1);
			//console.log(diff(state, ex.state112));
		});
		it('should leave widgetIdNext as it was', () => {
			expect(state.getIn(['widgetIdNext'])).to.equal(3);
		});
		it('should move the focus on the second window', () => {
			expect(State.getCurrentWindowId(state)).to.equal(2);
		})
		it('should remove window 1 from windows lists', () => {
			expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(2));
			expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(2));
			expect(state.getIn(['windowIdOrder'])).to.equal(List.of(2));
			expect(state.getIn(['windowIdStack'])).to.equal(List.of(2));
		});
	});
	it('handles removing last, unfocused widget', () => {
		const state = reducer(ex.state112, action2);
		//console.log(JSON.stringify(state.toJS(), null, '\t'));
		//console.log(diff(state, ex.state111));
		expect(state).to.equal(ex.state111.setIn(['widgetIdNext'], 3));
	});

	it('handles removing last, focused widget', () => {
		const actionA = {type: 'activateWindow', id: 2};
		const state1 = reducer(ex.state112, actionA);
		const state = reducer(state1, action2);
		console.log(JSON.stringify(state.toJS(), null, '\t'));
		console.log(diff(state, ex.state111));
		expect(state).to.equal(ex.state111.setIn(['widgetIdNext'], 3));
	});

	it('handles removing first, unfocused widget', () => {
		const actionA = {type: 'activateWindow', id: 2};
		const state1 = reducer(ex.state112, actionA);
		const state = reducer(state1, action1);
		//console.log(JSON.stringify(state.toJS(), null, '\t'));
		//console.log(diff(state, ex.state111));
		//it('should move the focus on the second window', () => {
		expect(State.getCurrentWindowId(state)).to.equal(2);
		//it('should remove window 1 from windows lists', () => {
		expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(2));
		expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(2));
		expect(state.getIn(['windowIdOrder'])).to.equal(List.of(2));
		expect(state.getIn(['windowIdStack'])).to.equal(List.of(2));
	});
});
