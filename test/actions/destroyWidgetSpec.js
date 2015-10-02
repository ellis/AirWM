import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../../src/reducer.js';
import State from '../../src/state.js';
import * as ex from '../exampleStates.js';

describe('destroyWidget', () => {
	describe('removing first window', () => {
		let state;
		before(() => {
			state = reducer(ex.state112, {type: 'destroyWidget', id: 1});
			//State.print(state);
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
});
