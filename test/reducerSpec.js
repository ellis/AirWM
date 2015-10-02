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

	describe('createWidget', () => {
		const action1 = {
			type: 'createWidget',
			widget: {
				type: 'window',
				xid: 1001
			}
		};
		const state1 = reducer(ex.state110, action1);
		describe('adding first window', () => {
			let state = state1;
			it('should increment widgetIdNext', () => {
				expect(state.getIn(['widgetIdNext'])).to.equal(2);
			})
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
/*
		const action2 = {
			type: 'createWidget',
			widget: {
				type: 'window',
				xid: 1002
			}
		};
		const state2 = reducer(state1, action2);
		describe('adding second window', () => {
			let state = state2;
			it('should increment widgetIdNext', () => {
				expect(state.getIn(['widgetIdNext'])).to.equal(3);
			})
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

		describe('removing first window, then adding a thrid', () => {
			const actionA = {type: 'destroyWidget', id: 1};
			const action3 = {
				type: 'createWidget',
				widget: {
					type: 'window',
					xid: 1003
				}
			};
			const state1 = reducer(ex.state112, actionA);
			const state = reducer(state1, action3);
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state111));
			it('should increment widgetIdNext', () => {
				expect(state.getIn(['widgetIdNext'])).to.equal(4);
			});
			it('should leave the focus on the second window', () => {
				expect(state.getIn(['focusCurrentId'])).to.equal(2);
				expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
			});
			it('should add window to the current desktop', () => {
				expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(2, 3));
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
					expect(state.getIn(['focusCurrentId'])).to.equal(1);
					expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(1);
				});
				it('should add window to the current screen', () => {
					expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(1));
					expect(state.hasIn(['widgets', '2', 'parentId'])).to.equal(false);
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
		*/
	});

/*
	describe('destroyWidget', () => {
		const action1 = {type: 'destroyWidget', id: 1};
		const action2 = {type: 'destroyWidget', id: 2};
		it('handles removing last, unfocusd widget', () => {
			const state = reducer(ex.state112, action2);
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state111));
			expect(state).to.equal(ex.state111.setIn(['widgetIdNext'], 3));
		});

		it('handles removing last, focusd widget', () => {
			const actionA = {type: 'activateWindow', id: 2};
			const state1 = reducer(ex.state112, actionA);
			const state = reducer(state1, action2);
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state111));
			expect(state).to.equal(ex.state111.setIn(['widgetIdNext'], 3));
		});

		it('handles removing first, unfocusd widget', () => {
			const actionA = {type: 'activateWindow', id: 2};
			const state1 = reducer(ex.state112, actionA);
			const state = reducer(state1, action1);
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state111));
			expect(state.getIn(['focusCurrentId'])).to.equal(2);
			expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(2);
			expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(2));
		});
	});

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
