import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import checkList from '../checkList.js';
import reducer from '../../src/reducer.js';
import StateWrapper from '../../src/StateWrapper.js';
import * as ex from '../exampleStates.js';

const action1 = {
	type: 'addWindow',
	window: {
		type: 'window',
		xid: 1001
	}
};

const action2 = {
	type: 'addWindow',
	window: {
		type: 'window',
		xid: 1002
	}
};

describe('addWindow', () => {
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

	describe('adding three windows', () => {
		it('it should have the propert stack order', () => {
			let state = ex.state120;
			state = reducer(state, {type: 'addWidget', window: {type: 'window', xid: 1001}});
			state = reducer(state, {type: 'addWidget', window: {type: 'window', xid: 1002}});
			state = reducer(state, {type: 'addWidget', window: {type: 'window', xid: 1003}});
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
				type: 'addWidget',
				window: {
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
			type: 'addWidget',
			window: {
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
