import {List, Map, fromJS} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../src/reducer.js';
import State from '../src/state.js';
import * as ex from './exampleStates.js';

describe('reducer', () => {
	it('handles initialize', () => {
		const action = {
			type: 'initialize',
			desktops: [
				{
					name: "web",
					layout: "tile-right"
				}
			],
			screens: [
				{
					xidRoot: ex.screen0_xidRoot,
					width: 800,
					height: 600,
				}
			]
		};
		const state = reducer(undefined, action);
		//State.print(state);
		//console.log(diff(state, ex.state110));
		expect(state).is.equal(ex.state110);
	});

/*
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
			const state1 = reducer(ex.state112, action);
			expect(state1.getIn(['focusCurrentId'])).to.equal(2);
			expect(state1.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
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
			const state1 = reducer(ex.state112, action);
			expect(state1.getIn(['focusCurrentId'])).to.equal(2);
			expect(state1.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
		});
		it('handle situation with two windows, called twice (no change)', () => {
			const state1 = reducer(ex.state112, action);
			const state2 = reducer(state1, action);
			expect(state2).to.equal(ex.state112);
		});
	});
*/
	it('handles activateWindow', () => {
		const action1 = {
			type: 'activateWindow',
			id: 2
		};
		const state = reducer(ex.state112, action1);
		expect(State.getCurrentWindowId(state)).to.equal(2);
		expect(state1.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(1, 2));
		expect(state1.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(2, 1));
	});

	it('handles setX11ScreenColors', () => {
		const action1 = {
			type: 'setX11ScreenColors',
			screenId: 0,
			colors: {
				'a': 1,
				'b': 2
			}
		};
		const state1 = reducer(ex.state112, action1);
		expect(state1.getIn(['x11', 'screens', '0', 'colors', 'a'])).to.equal(1);
		expect(state1.getIn(['x11', 'screens', '0', 'colors', 'b'])).to.equal(2);
	});

});
