import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import checkList from '../checkList.js';
import reducer from '../../src/reducer.js';
import State from '../../src/state.js';
import StateWrapper from '../../src/StateWrapper.js';
import * as ex from '../exampleStates.js';

describe('activateDesktop', () => {
	/*describe('with one screen, one dock, no windows', () => {
		describe('raise desktop 2', () => {
			const state = reducer(ex.state120, {type: 'activateDesktop', desktop: 1});
			const builder = new StateWrapper(state);
			builder.print()
			it('should show desktop 2', () => {
				checkList(builder, "activateDesktop 1", [
					`widgets.0.parentId`, -1,
					`widgets.1.parentId`, 2,
					`currentDesktopId`, 1
				]);
			});
			it('should leave x11 focus on root', () => {
				expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus', 0])).to.equal(ex.screen0_xidRoot);
			});
		});
	});
*/
	describe("with one screen, one dock, one window", () => {
		const action1 = {
			type: 'addWindow',
			widget: {
				type: 'window',
				xid: 1001
			}
		};
		const state121 = reducer(ex.state120, action1);
		const state1 = reducer(state121, {type: 'activateDesktop', desktop: 1});
		describe('raise desktop 2', () => {
			const builder = new StateWrapper(state1);
			const state = state1;
			it('should show desktop 2', () => {
				checkList(builder, "activateDesktop 1", [
					`widgets.0.parentId`, -1,
					`widgets.1.parentId`, 2,
					`currentDesktopId`, 1,
					// hides previously visible window:
					`currentWindowId`, -1,
					// Focus on root:
					`x11.wmSettings.SetInputFocus`, [ex.screen0_xidRoot]
				]);
			});
		});

		describe('switch back to desktop 1', () => {
			const state2 = reducer(state1, {type: 'activateDesktop', desktop: 0});
			it('should be the same as before', () => {
				const expected2 = state121
					.setIn(['widgets', '1', 'parentId'], -1)
					.setIn(['widgets', '2', 'desktopIdChain', 1], 1);
				//State.print(state2)
				//console.log(diff(state2, expected2));
				expect(state2).to.deep.equal(expected2);
			});
		});
	});
/*
	describe('with two screens, one dock, no windows', () => {
		describe('raise desktop 2', () => {
			const state = reducer(ex.state240, {type: 'activateDesktop', num: 1});
			it('should switch to desktop 2 on screen 2', () => {
				expect(state.getIn(['screenCurrentId'])).to.equal(1);
				expect(State.getCurrentDesktopId(state, 0)).to.equal(0);
				expect(State.getCurrentDesktopId(state, 1)).to.equal(1);
				expect(state.getIn(['widgets', '0', 'screenId'])).to.equal(0);
				expect(state.getIn(['widgets', '1', 'screenId'])).to.equal(1);
			});
			it('should set x11 focus to screen 2 root', () => {

			});
		});
		describe('raise desktop 3', () => {
			const state = reducer(ex.state240, {type: 'activateDesktop', num: 2});
			it('should show desktop 3 on screen 1', () => {
				expect(state.getIn(['screenCurrentId'])).to.equal(0);
				expect(State.getCurrentDesktopId(state, 0)).to.equal(2);
				expect(State.getCurrentDesktopId(state, 1)).to.equal(1);
				expect(state.getIn(['widgets', '0', 'screenId'])).to.be.undefined;
				expect(state.getIn(['widgets', '1', 'screenId'])).to.equal(1);
				expect(state.getIn(['widgets', '2', 'screenId'])).to.equal(0);
			});
		});
	});
*/
	// TODO: it('hides windows on previous desktop')
	// TODO: it('shows windows on current desktop')
});
/*
describe('activateDesktop with two screens', () => {
	// TODO: move this up
	describe('switch away from desktop with windows', () => {
		const action1 = {
			type: 'createWidget',
			widget: {
				type: 'window',
				xid: 1001
			}
		};
		const state241 = reducer(ex.state240, action1);
		const state = reducer(state241, {type: 'activateDesktop', num: 2});
		console.log(JSON.stringify(state.toJS(), null, '\t'));
		it('should show desktop 3 on screen 1', () => {
			expect(State.getCurrentDesktopId(state, 0)).to.equal(2);
			expect(state.getIn(['widgets', '2', 'screenId'])).to.equal(0);
		});
		it('hides previously visible window', () => {
			expect(state.getIn(['widgets', '5', 'visible'])).to.equal(false);
		});
		it('should not have a focus window', () => {
			expect(state.getIn(['focusCurrentId'], -1)).to.equal(-1);
		});
		it('should set x11.wmSettings.SetInputFocus to the screen id', () => {
			console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state2, state121));
			expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus'])).to.equal(List.of(ex.screen1_xidRoot));
		});
	});
});
*/
