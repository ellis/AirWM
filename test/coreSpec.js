import {List, Map} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import * as core from '../lib/core.js';

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
			const state = Immutable.fromJS({
				widgets: {
					0: {
						name: "web",
						screen: 0,
						width: 800,
						height: 600
					}
				},
				screens: {
					0: {
						width: 800,
						height: 600,
						desktopCurrent: 0
					}
				},
				screenCurrent: 0
			});
			const widget1 = {
				xid: 0x010000d0
			};
			const nextState = core.addWidget(state, widget1);
			//console.log(JSON.stringify(nextState.toJS(), null, '\t'));
			const expected1 = Immutable.fromJS({
				widgets: {
					0: {
						name: "web",
						screen: 0,
						width: 800,
						height: 600,
						children: [1],
						//focusCurrent: 1
					},
					1: {
						xid: 0x010000d0,
						//width: 800,
						//height: 600,
						parent: 0
					}
				},
				screens: {
					0: {
						width: 800,
						height: 600,
						desktopCurrent: 0
					}
				},
				screenCurrent: 0,
				//focusCurrent: 1
			});
			//console.log(diff(nextState, expected1));
			expect(nextState).to.equal(expected1);
		});
	});
});
