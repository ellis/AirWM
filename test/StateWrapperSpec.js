import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {assert} from 'chai';
import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';

const ActionObjects = {
	screen100: {
		xid: 100,
		width: 800,
		height: 600,
	}
};

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
		const s1 = builder.addScreen(ActionObjects.screen100);
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
		const s1 = builder.addScreen(ActionObjects.screen100);

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
		const s1 = builder.addScreen(ActionObjects.screen100);

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
		const s1 = builder.addScreen(ActionObjects.screen100);
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
		const s1 = builder.addScreen(ActionObjects.screen100);
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
		const s1 = builder.addScreen(ActionObjects.screen100);
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

	it('activateWindow (s1d2 + addWindow + moveWindowToDesktop 1)', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen100);
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
		const s1 = builder.addScreen(ActionObjects.screen100);
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
});
