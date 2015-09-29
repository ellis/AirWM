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
		it('adds an X11 window to the state', () => {
			//console.log(Immutable);
			const widget1 = {
				xid: 1001
			};
			const nextState = core.addWidget(state110, widget1);
			//console.log(JSON.stringify(nextState.toJS(), null, '\t'));
			const expected1 = Immutable.fromJS({
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
			//console.log(diff(nextState, expected1));
			expect(nextState).to.equal(expected1);
		});
	});
});
