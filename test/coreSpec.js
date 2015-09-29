import {List, Map} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import * as core from '../lib/core.js';

const screen0_xidRoot = 100;

const state110 = Immutable.fromJS({
	widgets: {
		0: {
			name: "web",
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right"
		}
	},
	screens: {
		0: {
			xidRoot: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopCurrentId: 0
		}
	},
	desktopIds: [0],
	screenCurrentId: 0,
	x11: {
		focusXid: screen0_xidRoot,
		desktopNum: 0
	}
});

const state111 = Immutable.fromJS({
	widgets: {
		0: {
			name: "web",
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right",
			childIds: [1],
			focusCurrentId: 1
		},
		1: {
			xid: 1001,
			rc: [5, 5, 790, 590],
			parentId: 0
		}
	},
	screens: {
		0: {
			xidRoot: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopCurrentId: 0
		}
	},
	desktopIds: [0],
	screenCurrentId: 0,
	focusCurrentId: 1,
	x11: {
		focusXid: 1001,
		desktopNum: 0
	}
});

const state112 = Immutable.fromJS({
	widgets: {
		0: {
			name: "web",
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right",
			childIds: [1, 2],
			focusCurrentId: 1
		},
		1: {
			xid: 1001,
			parentId: 0,
			rc: [5, 5, 392, 590]
		},
		2: {
			xid: 1002,
			parentId: 0,
			rc: [402, 5, 392, 590]
		}
	},
	screens: {
		0: {
			xidRoot: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopCurrentId: 0
		}
	},
	desktopIds: [0],
	screenCurrentId: 0,
	focusCurrentId: 1,
	x11: {
		focusXid: 1001,
		desktopNum: 0
	}
});

describe('application logic', () => {

	describe('initialize', () => {
		it('initializes the state with desktops and screens', () => {
			const desktops = [
				{
					name: "web",
					layout: "tile-right"
				}
			];
			const screens = [
				{
					xidRoot: screen0_xidRoot,
					width: 800,
					height: 600,
				}
			];
			const state = core.initialize(desktops, screens);
			//console.log(state);
			//console.log(diff(state, state110));
			expect(state).is.equal(state110);
		});
	});

	describe('addXwin', () => {
		//console.log(Immutable);
		const widget1 = {
			xid: 1001
		};
		const state1 = core.addWidget(state110, widget1);
		describe('adding first window', () => {
			let state = state1;
			it('should set focus to that window', () => {
				expect(state.getIn(['focusCurrentId'])).to.equal(1);
				expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(1);
				expect(state.getIn(['x11', 'focusXid'])).to.equal(1001);
			});
			it('should add window to the current desktop', () => {
				expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(1));
			});
			//console.log(JSON.stringify(nextState.toJS(), null, '\t'));
			//console.log(diff(nextState, expected1));
			expect(state).to.equal(state111);
		});

		const widget2 = {
			xid: 1002
		};
		const state2 = core.addWidget(state1, widget2);
		describe('adding second window', () => {
			let state = state2;
			it('should leave the focus on the first window', () => {
				expect(state.getIn(['focusCurrentId'])).to.equal(1);
				expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(1);
				expect(state.getIn(['x11', 'focusXid'])).to.equal(1001);
			});
			it('should add window to the current desktop', () => {
				expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(1, 2));
			});
			//console.log(JSON.stringify(nextState.toJS(), null, '\t'));
			//console.log(diff(nextState, expected1));
			expect(state).to.equal(state112);
		});
	});
});
