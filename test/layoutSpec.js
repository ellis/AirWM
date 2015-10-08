import _ from 'lodash';
import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {assert} from 'chai';
import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';
import {updateLayout} from '../src/layout.js';

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

/*[{
	actions: b => {
		const d1 = b.addDesktop({});
		return {d1}
	},
	asserts: x => {
		'widgetIdNext': x.d1 + 1],
		'screenIdOrder': [],
		'desktopIdOrder': [d1],
		'windowIdOrder': [],
		'widgetIdChain': [d1],
		'currentScreenId': -1,
		'currentDesktopId': -1,
		'currentWindowId': -1
	],
	children: [{
		actions: b => {

		}
	}]
}];*/

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

describe('updateLayout', () => {
	it('with normal windows', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d1);

		updateLayout(builder);
		checkList(builder, "one window", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [5, 5, 790, 590],
		]);

		const w2 = builder.addWindow({xid: 1001});
		const w3 = builder.addWindow({xid: 1002});
		const w4 = builder.addWindow({xid: 1003});
		builder.moveWindowToDesktop(w2, d1);
		builder.moveWindowToDesktop(w3, d1);
		builder.moveWindowToDesktop(w4, d2);
	});
});
