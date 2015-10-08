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

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(w1 + 1);

		builder.moveWindowToScreen(w1, s2);
		expect(builder.getScreenIdOrder(), 'screen order #1').to.equal(List([s1, s2]));
		expect(builder.getDesktopIdOrder(), 'desktop order #1').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order #1').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain #1').to.equal(List([d1, s1, d2, s2, w1]));
		expect(builder.currentScreenId, 'current screen #1').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop #1').to.equal(d1);
		expect(builder.currentWindowId, 'current window #1').to.equal(-1);
		expect(builder.desktopById(d1).getChildIdOrder(), 'desktop 1 window ID order #1').to.equal(List());
		expect(builder.desktopById(d1).getChildIdChain(), 'desktop 1 window ID order #1').to.equal(List());
		expect(builder.desktopById(d2).getChildIdOrder(), 'desktop 2 window ID order #1').to.equal(List([w1]));
		expect(builder.desktopById(d2).getChildIdChain(), 'desktop 2 window ID order #1').to.equal(List([w1]));

		builder.moveWindowToScreen(w1, s1);
		expect(builder.getScreenIdOrder(), 'screen order #2').to.equal(List([s1, s2]));
		expect(builder.getDesktopIdOrder(), 'desktop order #2').to.equal(List([d1, d2]));
		expect(builder.getWindowIdOrder(), 'window order #2').to.equal(List([w1]));
		expect(builder.getWidgetIdChain(), 'widget chain #2').to.equal(List([w1, d1, s1, d2, s2]));
		expect(builder.currentScreenId, 'current screen #2').to.equal(s1);
		expect(builder.currentDesktopId, 'current desktop #2').to.equal(d1);
		expect(builder.currentWindowId, 'current window #2').to.equal(w1);
		expect(builder.desktopById(d1).getChildIdOrder(), 'desktop 1 window ID order #2').to.equal(List([w1]));
		expect(builder.desktopById(d1).getChildIdChain(), 'desktop 1 window ID order #2').to.equal(List([w1]));
		expect(builder.desktopById(d2).getChildIdOrder(), 'desktop 2 window ID order #2').to.equal(List());
		expect(builder.desktopById(d2).getChildIdChain(), 'desktop 2 window ID order #2').to.equal(List());
	});

	it('activateWindow (s1d2 + addWindow + moveWindowToDesktop 1)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w1, d1);
		builder.activateWindow(w1);

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(w1 + 1);
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

		expect(builder.widgetIdNext, 'widgetIdNext').to.equal(w1 + 1);
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
});
