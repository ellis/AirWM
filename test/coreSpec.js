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
			screen: 0,
			width: 800,
			height: 600,
			layout: "tile-right"
		}
	},
	screens: {
		0: {
			xidRoot: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopCurrent: 0
		}
	},
	desktops: [0],
	screenCurrent: 0,
	x11: {
		focusXid: screen0_xidRoot,
		desktopId: 0
	}
});

describe('application logic', () => {

	describe('setContainers', () => {
		it('adds the containers to the state', () => {
			const state = Map();
			const containers = {
				0: {
					name: "web"
				}
			};
			const nextState = core.setContainers(state, containers);
			expect(nextState).to.equal(Map({
				containers: Map(containers)
			}));
		});
	});

	describe('setScreens', () => {
		it('adds the screens to the state', () => {
			const state = Map();
			const screens = {
				0: {
					width: 800,
					height: 600
				}
			};
			const nextState = core.setScreens(state, screens);
			expect(nextState).to.equal(Map({
				screens: Map(screens)
			}));
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
						screen: 0,
						width: 800,
						height: 600,
						layout: "tile-right",
						children: [1],
						focusCurrent: 1
					},
					1: {
						xid: 1001,
						//width: 800,
						//height: 600,
						parent: 0
					}
				},
				screens: {
					0: {
						xidRoot: screen0_xidRoot,
						width: 800,
						height: 600,
						desktopCurrent: 0
					}
				},
				desktops: [0],
				screenCurrent: 0,
				focusCurrent: 1,
				x11: {
					focusXid: 1001,
					desktopId: 0
				}
			});
			//console.log(diff(nextState, expected1));
			expect(nextState).to.equal(expected1);
		});
	});
});
