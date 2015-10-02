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

	describe('activateDesktop', () => {
		describe('with one screen, one dock, no windows', () => {
			describe('raise desktop 2', () => {
				const state = reducer(ex.state120, {type: 'activateDesktop', num: 1});
				it('should show desktop 2', () => {
					expect(State.getCurrentDesktopId(state, 0)).to.equal(1);
					expect(state.getIn(['widgets', '0', 'screenId'])).to.be.undefined;
					expect(state.getIn(['widgets', '1', 'screenId'])).to.equal(0);
				});
				it('should leave x11 focus on root', () => {
					expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus', 0])).to.equal(ex.screen0_xidRoot);
				});
			});
		});
/*
		describe("with one screen, one dock, one window", () => {
			const action1 = {
				type: 'createWidget',
				widget: {
					type: 'window',
					xid: 1001
				}
			};
			const state121 = reducer(ex.state120, action1);
			const state1 = reducer(state121, {type: 'activateDesktop', num: 1});
			describe('raise desktop 2', () => {
				const state = state1;
				it('should show desktop 2', () => {
					expect(state.getIn(['screens', '0', 'desktopCurrentId'])).to.equal(1);
					expect(state.getIn(['widgets', '0', 'screenId'])).to.be.undefined;
					expect(state.getIn(['widgets', '1', 'screenId'])).to.equal(0);
				});
				it('hides previously visible window', () => {
					expect(state.getIn(['widgets', '3', 'visible'])).to.equal(false);
				});
				it('should not have a focus window', () => {
					expect(state.getIn(['focuseCurrentId'])).to.be.undefined;
				});
				it('should set x11 focus on root', () => {
					expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus', 0])).to.equal(ex.screen0_xidRoot);
				});
			});

			describe('switch back to desktop 1', () => {
				const state2 = reducer(state1, {type: 'activateDesktop', num: 0});
				it('should be the same as before', () => {
					//console.log(JSON.stringify(state2.toJS(), null, '\t'));
					//console.log(diff(state2, state121));
					expect(state2).to.equal(state121.setIn(['widgets', '1', 'rc'], List.of(0, 0, 800, 600)));
				});
			});
		});

		describe('with two screens, one dock, no windows', () => {
			describe('raise desktop 2', () => {
				const state = reducer(ex.state240, {type: 'activateDesktop', num: 1});
				it('should switch to desktop 2 on screen 2', () => {
					expect(state.getIn(['screenCurrentId'])).to.equal(1);
					expect(state.getIn(['screens', '0', 'desktopCurrentId'])).to.equal(0);
					expect(state.getIn(['screens', '1', 'desktopCurrentId'])).to.equal(1);
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
					expect(state.getIn(['screens', '0', 'desktopCurrentId'])).to.equal(2);
					expect(state.getIn(['screens', '1', 'desktopCurrentId'])).to.equal(1);
					expect(state.getIn(['widgets', '0', 'screenId'])).to.be.undefined;
					expect(state.getIn(['widgets', '1', 'screenId'])).to.equal(1);
					expect(state.getIn(['widgets', '2', 'screenId'])).to.equal(0);
				});
			});
		});
		// TODO: it('hides windows on previous desktop')
		// TODO: it('shows windows on current desktop')
	});

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
				expect(state.getIn(['screens', '0', 'desktopCurrentId'])).to.equal(2);
				expect(state.getIn(['widgets', '2', 'screenId'])).to.equal(0);
			});
			it('hides previously visible window', () => {
				expect(state.getIn(['widgets', '5', 'visible'])).to.equal(false);
			});
			it('should not have a focus window', () => {
				expect(state.getIn(['focuseCurrentId'], -1)).to.equal(-1);
			});
			it('should set x11.wmSettings.SetInputFocus to the screen id', () => {
				console.log(JSON.stringify(state.toJS(), null, '\t'));
				//console.log(diff(state2, state121));
				expect(state.getIn(['x11', 'wmSettings', 'SetInputFocus'])).to.equal(List.of(ex.screen1_xidRoot));
			});
		});
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
		});*/
	});
/*
	describe('destroyWidget', () => {
		const action1 = {type: 'destroyWidget', id: 1};
		const action2 = {type: 'destroyWidget', id: 2};
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
			//console.log(JSON.stringify(state.toJS(), null, '\t'));
			//console.log(diff(state, ex.state111));
			expect(state).to.equal(ex.state111.setIn(['widgetIdNext'], 3));
		});

		it('handles removing first, unfocused widget', () => {
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
