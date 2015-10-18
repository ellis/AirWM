import _ from 'lodash';
import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {assert} from 'chai';
import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';
import updateLayout from '../src/updateLayout.js';
import updateX11 from '../src/updateX11.js';

const ActionObjects = {
	screen1: {
		xid: 100,
		width: 800,
		height: 600,
	},
	screen2: {
		xid: 101,
		width: 800,
		height: 600,
	},
};

/**
 * Take a flat list of JSON path + value pairs and makes sure the state matches.
 * @param  {string} desc - description of what's being checked
 * @param  {array} stuff - the flat list of path/value pairs to chekc
 */
function checkList(builder, desc, stuff) {
	const state = builder.getState().toJS();
	_.chunk(stuff, 2).forEach(l => {
		const [key, expected] = l;
		const actual = _.get(state, key);
		if (_.isUndefined(expected))
			expect(actual, desc+": "+key).to.be.undefined;
		else
			expect(actual, desc+": "+key).to.deep.equal(expected);
	})
}

describe('updateX11', () => {
	it('with a normal window', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d1);

		updateLayout(builder);
		updateX11(builder);
		//builder.print();
		checkList(builder, "one window", [
			`x11`, {
				"windowSettings": {
					"3": {
						"xid": 1000,
						"visible": true,
						"ewmh": {
							"WM_STATE": {
								"state": 1,
								"icon": 0
							},
							"_NET_WM_DESKTOP": [
								0
							],
							"_NET_WM_ALLOWED_ACTIONS": [
								"_NET_WM_ACTION_CLOSE"
							]
						},
						"desktopNum": 0,
						"ChangeWindowAttributes": [
							1000,
							{
								"borderPixel": 0,
								"eventMask": 16
							}
						],
						"ConfigureWindow": [
							1000,
							{
								"x": 5,
								"y": 5,
								"width": 780,
								"height": 580,
								"borderWidth": 5,
							}
						]
					}
				},
				"wmSettings": {
					"SetInputFocus": [
						1000
					],
					"ewmh": {
						"_NET_NUMBER_OF_DESKTOPS": [
							2
						],
						"_NET_ACTIVE_WINDOW": [
							1000
						],
						"_NET_CLIENT_LIST": [
							1000
						],
						"_NET_CLIENT_LIST_STACKING": [
							1000
						]
					}
				}

			}
		]);
	});
/*
	it('with background', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({type: 'background', xid: 1000});
		builder.moveWindowToScreen(w1, s1);

		updateLayout(builder);
		checkList(builder, "without other windows", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [0, 0, 800, 600],
		]);

		const w2 = builder.addWindow({xid: 1001});
		builder.moveWindowToDesktop(w2, d1);
		updateLayout(builder);
		checkList(builder, "with a normal window", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [0, 0, 800, 600],
			`widgets.${w2}.visible`, true,
			`widgets.${w2}.rc`, [5, 5, 790, 590],
		]);
	});

	it('with bottom dock', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({type: 'dock', dockGravity: 'bottom', dockSize: 10, xid: 1000});
		builder.moveWindowToScreen(w1, s1);

		updateLayout(builder);
		checkList(builder, "dock without other windows", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [0, 591, 800, 10],
		]);

		const w2 = builder.addWindow({xid: 1001});
		builder.moveWindowToDesktop(w2, d1);
		updateLayout(builder);
		checkList(builder, "dock with a normal window", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [0, 591, 800, 10],
			`widgets.${w2}.visible`, true,
			`widgets.${w2}.rc`, [5, 5, 790, 580],
		]);
	});
*/
	it('after removeWindow', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		const w2 = builder.addWindow({xid: 1001});
		builder.moveWindowToDesktop(w1, d1);
		builder.moveWindowToDesktop(w2, d1);
		updateLayout(builder);
		updateX11(builder);

		expect(builder.getState().hasIn(['widgets', w1.toString()]), 'w1 #1').to.equal(true);
		expect(builder.getState().hasIn(['widgets', w2.toString()]), 'w2 #1').to.equal(true);
		expect(builder.getState().hasIn(['x11', 'windowSettings', w1.toString()]), 'x11 w1 #1').to.equal(true);
		expect(builder.getState().hasIn(['x11', 'windowSettings', w2.toString()]), 'x11 w2 #1').to.equal(true);

		builder.removeWindow(w1);
		updateLayout(builder);
		updateX11(builder);

		expect(builder.getState().hasIn(['widgets', w1.toString()]), 'w1 #2').to.equal(false);
		expect(builder.getState().hasIn(['widgets', w2.toString()]), 'w2 #2').to.equal(true);
		expect(builder.getState().hasIn(['x11', 'windowSettings', w1.toString()]), 'x11 w1 #2').to.equal(false);
		expect(builder.getState().hasIn(['x11', 'windowSettings', w2.toString()]), 'x11 w2 #2').to.equal(true);
	});
});
