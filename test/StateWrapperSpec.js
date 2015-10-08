import _ from 'lodash';
import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {assert} from 'chai';
import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';

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

describe('StateWrapper', () => {
	it('empty', () => {
		const builder = new StateWrapper(initialState);
		expect(builder.getState()).to.equal(initialState);
	});

	it('addDesktop', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(d1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List([]));
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([d1]));
		expect(builder.currentScreenId, 'current screen').to.equal(-1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(-1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('addDesktop*2', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(d2 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List());
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List.of(d1, d2));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List());
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List.of(d1, d2));
		expect(builder.currentScreenId, 'current screen').to.equal(-1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(-1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('addScreen: should create a desktop and set it as current', () => {
		const builder = new StateWrapper(initialState);
		const s1 = builder.addScreen(ActionObjects.screen1);
		const d1 = s1 - 1;

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(s1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List());
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([d1, s1]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('addDesktop, addScreen: should assign the desktop to the new screen and focus it', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(s1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List());
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([d1, s1]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('addDesktop*2, addScreen', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(s1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List());
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([d1, s1, d2]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('addWindow', () => {
		const builder = new StateWrapper(initialState);
		const w1 = builder.addWindow({xid: 1000});

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(w1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([w1]));
		expect(builder.currentScreenId, 'current screen').to.equal(-1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(-1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('addWindow (s1d2)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(w1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([d1, s1, d2, w1]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('moveWindowToDesktop 1 (s1d2 + addWindow)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d1);

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(w1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([w1, d1, s1, d2]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d1);
		expect(builder.currentWindowId, 'current window').to.equal(w1);
	});

	it('moveWindowToDesktop 2 (s1d2 + addWindow)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d2);

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(w1 + 1);
		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([d1, s1, d2, w1]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d1);
		expect(builder.currentWindowId, 'current window').to.equal(-1);
	});

	it('moveWindowToScreen (window)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const s2 = builder.addScreen(ActionObjects.screen2);
		const w1 = builder.addWindow({xid: 1000});

		builder.moveWindowToScreen(w1, s2);
		checkList(builder, "moveWindowToScreen(w1, s2)", [
			`screenIdOrder`, [s1, s2],
			`desktopIdOrder`, [d1, d2],
			`windowIdOrder`, [w1],
			`widgetIdChain`, [d1, s1, d2, s2, w1],
			`currentScreenId`, s1,
			`currentDesktopId`, d1,
			`currentWindowId`, -1,
			`widgets.${d1}.childIdOrder`, [],
			`widgets.${d1}.childIdChain`, [],
			`widgets.${d2}.childIdOrder`, [w1],
			`widgets.${d2}.childIdChain`, [w1],
		]);

		builder.moveWindowToScreen(w1, s1);
		checkList(builder, "moveWindowToScreen(w1, s1)", [
			`screenIdOrder`, [s1, s2],
			`desktopIdOrder`, [d1, d2],
			`windowIdOrder`, [w1],
			`widgetIdChain`, [w1, d1, s1, d2, s2],
			`currentScreenId`, s1,
			`currentDesktopId`, d1,
			`currentWindowId`, w1,
			`widgets.${d1}.childIdOrder`, [w1],
			`widgets.${d1}.childIdChain`, [w1],
			`widgets.${d2}.childIdOrder`, [],
			`widgets.${d2}.childIdChain`, [],
		]);
	});

	it('moveWindowToScreen (background)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const s2 = builder.addScreen(ActionObjects.screen2);
		const w1 = builder.addWindow({type: 'background', xid: 1000});

		builder.moveWindowToScreen(w1, s1);
		checkList(builder, "moveWindowToScreen(w1, s1)", [
			`windowIdOrder`, [w1],
			`widgetIdChain`, [d1, s1, d2, s2, w1],
			`currentScreenId`, s1,
			`currentDesktopId`, d1,
			`currentWindowId`, -1,
			`widgets.${d1}.childIdOrder`, [],
			`widgets.${d1}.childIdChain`, [],
			`widgets.${s1}.backgroundId`, w1,
			`widgets.${w1}.parentId`, s1,
		]);

		builder.moveWindowToScreen(w1, s2);
		checkList(builder, "moveWindowToScreen(w1, s2)", [
			`windowIdOrder`, [w1],
			`widgetIdChain`, [d1, s1, d2, s2, w1],
			`currentScreenId`, s1,
			`currentDesktopId`, d1,
			`currentWindowId`, -1,
			`widgets.${d2}.childIdOrder`, [],
			`widgets.${d2}.childIdChain`, [],
			`widgets.${s1}.backgroundId`, -1,
			`widgets.${s2}.backgroundId`, w1,
			`widgets.${w1}.parentId`, s2,
		]);
	});

	it('moveWindowToScreen (dock)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const s2 = builder.addScreen(ActionObjects.screen2);
		const w1 = builder.addWindow({type: 'dock', xid: 1000});

		builder.moveWindowToScreen(w1, s1);
		checkList(builder, "moveWindowToScreen(w1, s1)", [
			`windowIdOrder`, [w1],
			`widgetIdChain`, [d1, s1, d2, s2, w1],
			`currentScreenId`, s1,
			`currentDesktopId`, d1,
			`currentWindowId`, -1,
			`widgets.${d1}.childIdOrder`, [],
			`widgets.${d1}.childIdChain`, [],
			`widgets.${s1}.dockIdOrder`, [w1],
			`widgets.${w1}.parentId`, s1,
		]);

		builder.moveWindowToScreen(w1, s2);
		checkList(builder, "moveWindowToScreen(w1, s2)", [
			`windowIdOrder`, [w1],
			`widgetIdChain`, [d1, s1, d2, s2, w1],
			`currentScreenId`, s1,
			`currentDesktopId`, d1,
			`currentWindowId`, -1,
			`widgets.${d2}.childIdOrder`, [],
			`widgets.${d2}.childIdChain`, [],
			`widgets.${s1}.dockIdOrder`, [],
			`widgets.${s2}.dockIdOrder`, [w1],
			`widgets.${w1}.parentId`, s2,
		]);
	});

	it('activateWindow (s1d2 + addWindow + moveWindowToDesktop 1)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d1);
		builder.activateWindow(w1);

		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([w1, d1, s1, d2]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d1);
		expect(builder.currentWindowId, 'current window').to.equal(w1);
	});

	it('activateWindow (s1d2 + addWindow + moveWindowToDesktop 2)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d2);
		builder.activateWindow(w1);

		expect(builder.getScreenIdOrder(), 'screen order').to.equal(List([s1]));
		expect(builder.getDesktopIdOrder(), 'desktop order').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain').to.equal(List([w1, d2, s1, d1]));
		expect(builder.currentScreenId, 'current screen').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop').to.equal(d2);
		expect(builder.currentWindowId, 'current window').to.equal(w1);
	});

	it('activateDesktop', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);

		builder.activateDesktop(d2);
		expect(builder.getWidgetIdChain(), 'widget chain #1').to.equal(List([d2, s1, d1]));

		builder.activateDesktop(d1);
		expect(builder.getWidgetIdChain(), 'widget chain #2').to.equal(List([d1, s1, d2]));

		// Add window on desktop 1
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d1);
		expect(builder.getWidgetIdChain(), 'widget chain #3').to.equal(List([w1, d1, s1, d2]));

		builder.activateDesktop(d2);
		expect(builder.getWidgetIdChain(), 'widget chain #4').to.equal(List([d2, s1, w1, d1]));

		// Add window on desktop 2
		builder.activateDesktop(d1);
		const w2 = builder.addWindow({xid: 1001});
		builder.moveWindowToDesktop(w2, d2);
		expect(builder.getWidgetIdChain(), 'widget chain #5').to.equal(List([w1, d1, s1, d2, w2]));

		builder.activateDesktop(d2);
		expect(builder.getWidgetIdChain(), 'widget chain #6').to.equal(List([w2, d2, s1, w1, d1]));
	});

	it('removeWindow', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);

		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d1);
		builder.removeWindow(w1);
		expect(builder.getWindowIdOrder(), 'window order #1').to.equal(List([]));
		expect(builder.getWidgetIdChain(), 'widget chain #1').to.equal(List([d1, s1, d2]));

		const w2 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w2, d2);
		builder.removeWindow(w2);
		expect(builder.getWindowIdOrder(), 'window order #2').to.equal(List([]));
		expect(builder.getWidgetIdChain(), 'widget chain #2').to.equal(List([d1, s1, d2]));

		const w3 = builder.addWindow({xid: 1000});
		const w4 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w3, d1);
		builder.moveWindowToDesktop(w4, d2);
		builder.removeWindow(w3);
		expect(builder.getWindowIdOrder(), 'window order #3').to.equal(List([w4]));
		expect(builder.getWidgetIdChain(), 'widget chain #3').to.equal(List([d1, s1, d2, w4]));
	});

	it('moveWindowToIndexNext/Prev', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		const w2 = builder.addWindow({xid: 1001});
		const w3 = builder.addWindow({xid: 1002});
		builder.moveWindowToDesktop(w1, d1);
		builder.moveWindowToDesktop(w2, d1);
		builder.moveWindowToDesktop(w3, d1);
		checkList(builder, "setup windows", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d2}.childIdChain`, [w1, w2, w3]
		]);
	});
});
