import {List, Map, fromJS} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../src/reducer.js';
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
		expect(state).is.equal(ex.state110);
	});

	describe('widget.add', () => {
		const action1 = {
			type: 'widget.add',
			widget: {
				xid: 1001
			}
		};
		const state1 = reducer(ex.state110, action1);
		describe('adding first window', () => {
			let state = state1;
			it('should set focus to that window', () => {
				expect(state.getIn(['focusCurrentId'])).to.equal(1);
				expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(1);
				expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus'])).to.equal(List.of(1001));
			});
			it('should add window to the current desktop', () => {
				expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(1));
				expect(state.getIn(['widgets', '1', 'parentId'])).to.equal(0);
				expect(state.getIn(['x11', 'windowSettings', '1', 'desktopNum'])).to.equal(0);
			});
			it('should make the window visible', () => {
				expect(state.getIn(['widgets', '1', 'visible'])).to.equal(true);
			});
			it('should equal fully specified state', () => {
				//console.log(JSON.stringify(state.toJS(), null, '\t'));
				//console.log(diff(state, ex.state111));
				expect(state).to.equal(ex.state111);
			});
		});

		const action2 = {
			type: 'widget.add',
			widget: {
				xid: 1002
			}
		};
		const state2 = reducer(state1, action2);
		describe('adding second window', () => {
			let state = state2;
			it('should leave the focus on the first window', () => {
				expect(state.getIn(['focusCurrentId'])).to.equal(1);
				expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(1);
				expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus'])).to.equal(List.of(1001));
			});
			it('should add window to the current desktop', () => {
				expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(1, 2));
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

	});

	it('handles focus.moveTo', () => {
		const action1 = {
			type: 'focus.moveTo',
			id: 2
		};
		const state1 = reducer(ex.state112, action1);
		expect(state1.getIn(['focusCurrentId'])).to.equal(2);
		expect(state1.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
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
