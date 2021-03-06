import _ from 'lodash';
import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import {assert} from 'chai';
import diff from 'immutablediff';

import checkList from './checkList.js';
import StateWrapper, {initialState} from '../src/StateWrapper.js';
import * as ex from './exampleStates.js';

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

	it('addWindow (transient for focused window)', () => {
		const builder = new StateWrapper(ex.state111);
		const d1 = builder.findDesktopIdByNum(0);
		const w1 = builder.findWindowIdOnDesktopByNum(undefined, 0);
		const w2 = builder.attachWindow({transientForId: w1, xid: 1002});

		checkList(builder, undefined, [
			`widgetIdNext`, w2 + 1,
			`currentWindowId`, w2,
			`widgets.${d1}.childIdOrder`, [w1, w2],
		]);
	});

	it('addWindow (transient for non-focused window)', () => {
		const builder = new StateWrapper(ex.state111);
		const d1 = builder.findDesktopIdByNum(0);
		const w1 = builder.findWindowIdOnDesktopByNum(undefined, 0);
		const w2 = builder.addWindow({xid: 1002});
		builder.moveWindowToDesktop(w2, d1);
		const w3 = builder.attachWindow({transientForId: w2, xid: 1003});

		checkList(builder, undefined, [
			`widgetIdNext`, w3 + 1,
			`currentWindowId`, w1,
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
		]);
	});

	it('detachWindow 1', () => {
		const builder = new StateWrapper(ex.state110);
		const d1 = builder.findDesktopIdByNum(0);
		const w1 = builder.attachWindow({xid: 1000});
		builder.detachWindow(w1);

		checkList(builder, undefined, [
			`widgetIdNext`, w1 + 1,
			`currentWindowId`, -1,
			`windowIdOrder`, [],
			`windowIdStack`, [],
			`windowIdDetached`, [w1],
		]);
	});

	it('detachWindow 2', () => {
		const builder = new StateWrapper(ex.state110);
		const d1 = builder.findDesktopIdByNum(0);
		const w1 = builder.attachWindow({xid: 1001});
		const w2 = builder.attachWindow({xid: 1002});
		builder.detachWindow(w1);

		checkList(builder, undefined, [
			`widgetIdNext`, w2 + 1,
			`currentWindowId`, w2,
			`windowIdOrder`, [w2],
			`windowIdStack`, [w2],
			`windowIdDetached`, [w1],
		]);
	});

	it('detachWindow 3', () => {
		const builder = new StateWrapper(ex.state110);
		const d1 = builder.findDesktopIdByNum(0);
		const w1 = builder.attachWindow({xid: 1001});
		const w2 = builder.attachWindow({xid: 1002});
		const w3 = builder.attachWindow({xid: 1003});
		builder.detachWindow(w1);

		checkList(builder, undefined, [
			`widgetIdNext`, w3 + 1,
			`currentWindowId`, w2,
			`windowIdOrder`, [w2, w3],
			`windowIdStack`, [w2, w3],
			`windowIdDetached`, [w1],
		]);
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
		expect(builder.getState().hasIn(['widgets', w1.toString()]), 'widget 1').to.equal(false);

		const w2 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w2, d2);
		builder.removeWindow(w2);
		expect(builder.getWindowIdOrder(), 'window order #2').to.equal(List([]));
		expect(builder.getWidgetIdChain(), 'widget chain #2').to.equal(List([d1, s1, d2]));
		expect(builder.getState().hasIn(['widgets', w2.toString()]), 'widget 2').to.equal(false);

		const w3 = builder.addWindow({xid: 1000});
		const w4 = builder.addWindow({xid: 1000});
		builder.moveWindowToDesktop(w3, d1);
		builder.moveWindowToDesktop(w4, d2);
		builder.removeWindow(w3);
		expect(builder.getWindowIdOrder(), 'window order #3').to.equal(List([w4]));
		expect(builder.getWidgetIdChain(), 'widget chain #3').to.equal(List([d1, s1, d2, w4]));
		expect(builder.getState().hasIn(['widgets', w3.toString()]), 'widget 3').to.equal(false);
		expect(builder.getState().hasIn(['widgets', w4.toString()]), 'widget 4').to.equal(true);
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
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);

		builder.moveWindowToIndexNext(w1);
		checkList(builder, "moveWindowToIndexNext #1", [
			`widgets.${d1}.childIdOrder`, [w2, w1, w3],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);

		builder.moveWindowToIndexNext(w1);
		checkList(builder, "moveWindowToIndexNext #2", [
			`widgets.${d1}.childIdOrder`, [w2, w3, w1],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);

		builder.moveWindowToIndexNext(w1);
		checkList(builder, "moveWindowToIndexNext #3", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);

		builder.moveWindowToIndexPrev(w1);
		checkList(builder, "moveWindowToIndexPrev #1", [
			`widgets.${d1}.childIdOrder`, [w2, w3, w1],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);

		builder.moveWindowToIndexPrev(w1);
		checkList(builder, "moveWindowToIndexPrev #2", [
			`widgets.${d1}.childIdOrder`, [w2, w1, w3],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);

		builder.moveWindowToIndexPrev(w1);
		checkList(builder, "moveWindowToIndexPrev #3", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);
	});

	it('activateWindowNext/Prev', () => {
		const builder = new StateWrapper(initialState);
		const d1 = builder.addDesktop({});
		const d2 = builder.addDesktop({});
		const s1 = builder.addScreen(ActionObjects.screen1);
		const w1 = builder.addWindow({xid: 1000});
		const w2 = builder.addWindow({xid: 1001});
		const w3 = builder.addWindow({xid: 1002});
		const w4 = builder.addWindow({xid: 1003});
		builder.moveWindowToDesktop(w1, d1);
		builder.moveWindowToDesktop(w2, d1);
		builder.moveWindowToDesktop(w3, d1);
		builder.moveWindowToDesktop(w4, d2);
		checkList(builder, "setup windows", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`widgetIdChain`, [w1, d1, s1, d2, w2, w3, w4],
			`currentWindowId`, w1,
		]);

		builder.activateWindowNext();
		checkList(builder, "activateWindowNext #1", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w2, w1, w3],
			`currentWindowId`, w2,
		]);

		builder.activateWindowNext();
		checkList(builder, "activateWindowNext #2", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w3, w2, w1],
			`currentWindowId`, w3,
		]);

		builder.activateWindowNext();
		checkList(builder, "activateWindowNext #3", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w1, w3, w2],
			`currentWindowId`, w1,
		]);

		builder.activateWindowPrev();
		checkList(builder, "activateWindowPrev #1", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w3, w1, w2],
			`currentWindowId`, w3,
		]);

		builder.activateWindowPrev();
		checkList(builder, "activateWindowPrev #2", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w2, w3, w1],
			`currentWindowId`, w2,
		]);

		builder.activateWindowPrev();
		checkList(builder, "activateWindowPrev #3", [
			`widgets.${d1}.childIdOrder`, [w1, w2, w3],
			`widgets.${d1}.childIdChain`, [w1, w2, w3],
			`currentWindowId`, w1,
		]);
	});
});
