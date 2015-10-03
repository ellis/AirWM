import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../../src/reducer.js';
import State from '../../src/state.js';
import * as ex from '../exampleStates.js';

const action1 = {
	type: 'createWidget',
	widget: {
		type: 'window',
		xid: 1001
	}
};

const action2 = {
	type: 'createWidget',
	widget: {
		type: 'window',
		xid: 1002
	}
};

describe('createWidget', () => {
	let state1, state2;
	before(() => {
		state1 = reducer(ex.state110, action1);

		state2 = reducer(state1, action2);
	});

	describe('adding first window', () => {
		let state;
		before(() => {
			state = reducer(ex.state110, action1);
		});
		it('should increment widgetIdNext', () => {
			expect(state.getIn(['widgetIdNext'])).to.equal(2);
		})
		it('should set focus to that window', () => {
			expect(State.getCurrentWindowId(state)).to.equal(1);
			expect(state.getIn(['widgets', '0', 'childIdStack', 0])).to.equal(1);
			expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus'])).to.equal(List.of(1001));
		});
		it('should add window to the current desktop', () => {
			expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(1));
			expect(state.getIn(['widgets', '1', 'parentId'])).to.equal(0);
			expect(state.getIn(['x11', 'windowSettings', '1', 'desktopNum'])).to.equal(0);
		});
		it('should make the window visible', () => {
			expect(state.getIn(['widgets', '1', 'visible'])).to.equal(true);
		});
		it('should equal fully specified state', () => {
			//State.print(state);
			//console.log(diff(state, ex.state111));
			expect(state).to.equal(ex.state111);
		});
	});

	describe('adding second window', () => {
		let state;
		before(() => {
			const state1 = reducer(ex.state110, action1);
			state = reducer(state1, action2);
		});
		it('should increment widgetIdNext', () => {
			expect(state.getIn(['widgetIdNext'])).to.equal(3);
		})
		it('should leave the focus on the first window', () => {
			expect(State.getCurrentWindowId(state)).to.equal(1);
			expect(State.getCurrentWindowIdOnDesktop(state, 0)).to.equal(1);
			expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus'])).to.equal(List.of(1001));
		});
		it('should add window to the current desktop', () => {
			expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(1, 2));
			expect(state.getIn(['widgets', '2', 'parentId'])).to.equal(0);
			expect(state.getIn(['x11', 'windowSettings', '2', 'desktopNum'])).to.equal(0);
		});
		it('should make the window visible', () => {
			expect(state.getIn(['widgets', '2', 'visible'])).to.equal(true);
		});
		it('should equal fully specified state', () => {
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state112));
			expect(state).to.equal(ex.state112);
		});
	});

	describe('adding three windows', () => {
		it('it should have the propert stack order', () => {
			let state = ex.state120;
			state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1001}});
			state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1002}});
			state = reducer(state, {type: 'createWidget', widget: {type: 'window', xid: 1003}});
			expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(3, 4, 5));
			expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(3, 5, 4));
			expect(state.getIn(['windowIdOrder'])).to.equal(List.of(3, 4, 5));
			expect(state.getIn(['windowIdStack'])).to.equal(List.of(3, 5, 4));
		});
	});

	describe('removing first window, then adding a thrid', () => {
		let state;
		before(() => {
			const actionA = {type: 'destroyWidget', id: 1};
			const action3 = {
				type: 'createWidget',
				widget: {
					type: 'window',
					xid: 1003
				}
			};
			const state1 = reducer(ex.state112, actionA);
			//State.print(state1);
			state = reducer(state1, action3);
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state111));
		});
		it('should increment widgetIdNext', () => {
			expect(state.getIn(['widgetIdNext'])).to.equal(4);
		});
		it('should leave the focus on the second window', () => {
			expect(State.getCurrentWindowId(state)).to.equal(2);
		});
		it('should add window to the current desktop', () => {
			expect(state.getIn(['widgets', '0', 'childIdStack'])).to.equal(List.of(2, 3));
			expect(state.getIn(['widgets', '3', 'parentId'])).to.equal(0);
			expect(state.getIn(['x11', 'windowSettings', '3', 'desktopNum'])).to.equal(0);
		});
	});

	// TODO: when adding dock with no wondows, dock should not receive focus

	describe('add docks (with single window)', () => {
		const actionB = {
			type: 'createWidget',
			widget: {
				type: 'dock',
				dockGravity: 'bottom',
				dockSize: 10,
				xid: 2002
			}
		};
		const stateB = reducer(ex.state111, actionB);
		describe("add bottom dock", () => {
			const state = stateB;
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state111));
			it('should increment widgetIdNext', () => {
				expect(state.getIn(['widgetIdNext'])).to.equal(3);
			});
			it('should leave the focus on the first window', () => {
				expect(State.getCurrentWindowId(state)).to.equal(1);
			});
			it('should add window to the current screen', () => {
				expect(state.getIn(['widgets', '0', 'childIdOrder'])).to.equal(List.of(1));
				expect(state.getIn(['widgets', '2', 'parentId'])).to.be.undefined;
				expect(state.getIn(['widgets', '2', 'screenId'])).to.equal(0);
				expect(state.getIn(['screens', '0', 'dockIds'])).to.equal(List.of(2));
				expect(state.getIn(['x11', 'windowSettings', '2', 'desktopNum'])).to.equal(-1);
			});
			it('should have proper dimensions/configuration', () => {
				expect(state.getIn(['widgets', '2', 'rc'])).to.equal(List.of(0, 591, 800, 10));
				expect(state.getIn(['x11', 'windowSettings', '2', 'ConfigureWindow', 1])).to.equal(Map({
					x: 0, y: 591, width: 800, height: 10, borderWidth: 0, stackMode: 0
				}));
			});
		});
	});
});
