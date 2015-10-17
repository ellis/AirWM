import _ from 'lodash';
import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {assert} from 'chai';
import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';
import updateLayout from '../src/updateLayout.js';

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
		builder.moveWindowToDesktop(w2, d1);
		updateLayout(builder);
		checkList(builder, "two windows", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [5, 5, 392, 590],
			`widgets.${w2}.visible`, true,
			`widgets.${w2}.rc`, [402, 5, 392, 590],
		]);

		const w3 = builder.addWindow({xid: 1002});
		builder.moveWindowToDesktop(w3, d1);
		updateLayout(builder);
		checkList(builder, "three windows", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [5, 5, 392, 590],
			`widgets.${w2}.visible`, true,
			`widgets.${w2}.rc`, [402, 5, 392, 292],
			`widgets.${w3}.visible`, true,
			`widgets.${w3}.rc`, [402, 302, 392, 292],
		]);
	});

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

	it('with docks on bottom and top', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({type: 'dock', dockGravity: 'top', dockSize: 10, xid: 1000});
		const w2 = builder.addWindow({type: 'dock', dockGravity: 'bottom', dockSize: 10, xid: 1001});
		builder.moveWindowToScreen(w1, s1);
		builder.moveWindowToScreen(w2, s1);

		updateLayout(builder);
		checkList(builder, "dock without other windows", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [0, 0, 800, 10],
			`widgets.${w2}.visible`, true,
			`widgets.${w2}.rc`, [0, 591, 800, 10],
		]);

		const w3 = builder.addWindow({xid: 1001});
		builder.moveWindowToDesktop(w3, d1);
		updateLayout(builder);
		checkList(builder, "dock with a normal window", [
			`widgets.${w1}.visible`, true,
			`widgets.${w1}.rc`, [0, 0, 800, 10],
			`widgets.${w2}.visible`, true,
			`widgets.${w2}.rc`, [0, 591, 800, 10],
			`widgets.${w3}.visible`, true,
			`widgets.${w3}.rc`, [5, 15, 790, 570],
		]);
	});
});
