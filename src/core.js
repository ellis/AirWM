import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';
import Immutable from 'immutable';
//import diff from 'immutablediff';
import x11 from 'x11';

import State from './state.js';

export const empty = Map();

export function initialize(desktops, screens) {
	assert(_.isArray(desktops));
	assert(_.isArray(screens));
	assert(screens.length > 0, "can't do anything without any screens");

	// TODO: check required parameters on screens (width, height)

	desktops = _.cloneDeep(desktops);
	// Add default desktops if necessary
	while (desktops.length < screens.length) {
		desktops.push({});
	}

	// Add defaults to each desktop
	desktops.forEach(w => _.defaults(w, {
		type: "desktop",
		layout: "tile-right",
		childIdOrder: [],
		childIdStack: []
	}));

	const desktopIdOrder = _.range(0, desktops.length);

	// TODO: allow for initial assignment of desktops to screens rather
	//  than forcing the first desktops to be assigned in order.
	// Assign desktops to screens
	for (let i = 0; i < screens.length; i++) {
		screens[i].desktopIdStack = [i].concat(_.without(desktopIdOrder, i));
		desktops[i].screenId = i;
	}
	// Make sure other desktops don't have screen assignment
	for (let i = screens.length; i < desktops.length; i++) {
		delete desktops[i].screenId;
	}

	desktops.forEach(w => { w.type = "desktop"; });

	let state = Immutable.fromJS({
		widgets: _.zipObject(desktopIdOrder, desktops),
		screens: _.zipObject(_.range(0, screens.length), screens),
		widgetIdNext: desktops.length,
		screenIdOrder: _.range(0, screens.length),
		screenIdStack: _.range(0, screens.length),
		desktopIdOrder: desktopIdOrder,
		desktopIdStack: desktopIdOrder,
		windowIdOrder: [],
		windowIdStack: [],
		x11: {
			desktopNum: 0
		}
	});
	//state = updateFocus(state);
	state = updateLayout(state);
	state = updateX11(state);
	return state;
}

export function setX11ScreenColors(state, screenId, colors) {
	assert(_.isNumber(screenId));

	return state.mergeIn(['x11', 'screens', screenId.toString(), 'colors'], Map(colors));
}

export function activateDesktop(state, action) {
	const desktopNum = action.num;
	const desktopId = state.get('desktopIdOrder').get(desktopNum);
	if (desktopId >= 0) {
		const screenIdOld = state.getIn(['widgets', desktopId.toString(), 'screenId']);
		const screenId = State.getCurrentScreenId(state);
		// Current desktop of the target screen
		const desktopIdOld = State.getCurrentDesktopId(state, screenId);
		// If a desktop change is actually requested for the current screen.
		if (desktopId !== desktopIdOld) {
			// If desktop was on another screen, activate that screen
			if (screenIdOld >= 0)
				state = State.prependUniqueId(state, screenId, ['screenIdStack']);
			// Otherwise, bring desktop to the current screen
			else
				state = State.raiseDesktopOnScreen(state, desktopId, screenId);
			state = State.raiseDesktopInWmStack(state, desktopId);

			// Raise the desktop's focus window in the WM stack
			const focusId = state.getIn(['widgets', desktopId.toString(), 'childIdStack', 0]);
			if (focusId >= 0) {
				state = State.prependUniqueId(state, focusId, ['windowIdStack']);
			}

			//state = updateFocus(state);
			state = updateLayout(state);
			state = updateX11(state);
			State.check(state);
		}
	}

	return state;
}

export function closeWindow(state, action) {
	const {desktopId, windowId} = State.getCurrentScreenDesktopWindowIds(state);
	return destroyWidget(state, {id: windowId});
}

export function createWidget(state, action) {
	const w = action.widget;
	assert(state);
	assert(w);

	const screenId = State.getCurrentScreenId(state);
	const screen = State.getCurrentScreen(state, screenId);
	const widgets0 = state.get('widgets');
	const id = state.get('widgetIdNext');
	let w1 = Map(w);
	if (w.type === 'dock') {
		w1 = w1.merge({
			screenId: screenId,
			visible: true
		});
		// Add dock to screen and to widget list
		state = state.updateIn(
			['screens', screenId.toString(), 'dockIds'],
			List(),
			dockIds => dockIds.push(id)
		).setIn(['widgets', id.toString()], w1);
	}
	else {
		state = createWindow(state, w1, id);
	}

	// Add widget and increment widgetIdNext
	state = state.set('widgetIdNext', id + 1);

	//state = updateFocus(state, id);
	state = updateLayout(state);
	state = updateX11(state);
	State.check(state);

	return state;
}

function createWindow(state, w, id) {
	const desktopId = State.getCurrentDesktopId(state);
	return state
		.setIn(['widgets', id.toString()], w.merge({
			parentId: desktopId,
			visible: true
		}))
		.updateIn(
			['widgets', desktopId.toString(), 'childIdOrder'],
			List(),
			l => l.push(id)
		)
		.updateIn(
			['widgets', desktopId.toString(), 'childIdStack'],
			List(),
			l => {
				if (l.count() === 0) return l.push(id);
				// Insert at second position in stack
				else return l.splice(1, 0, id);
			}
		)
		.updateIn(
			['windowIdOrder'],
			List(),
			l => l.push(id)
		)
		.updateIn(
			['windowIdStack'],
			List(),
			l => {
				if (l.count() === 0) return l.push(id);
				// Insert at second position in stack
				else return l.splice(1, 0, id);
			}
		);
}

/*
function expandObjectSpec(state, spec) {
	let {screen: screenNum, desktop: desktopNum, window: windowNum} = spec;
	const l = [
		_.isUndefined(screenNum) ? 0 : 1,
		_.isUndefined(desktopNum) ? 0 : 1,
		_.isUndefined(windowNum) ? 0 : 1
	];

	function getScreenId() {
		if (_.isUndefined(screenNum))
			return state.get('screenCurrentId');
		else if (screenNum === '$')
			return state.get('screens').count() - 1;
		else if (_.isString(screenNum))
			return parseInt(screenNum) - 1;
		else
			return screenNum - 1;
	}

	function getDesktopId(screenId) {
		if (_.isUndefined(desktopNum))
			return state.getIn(['screens', screenId.toString(), 'desktopCurrentId']);
		else if (desktopNum === '$')
			return state.get('desktopIds').count() - 1;
		else {
			if (_.isString(desktopNum))
				desktopNum = parseInt(desktopNum);
			return state.getIn(['desktopIds']).get(desktopNum - 1, -1);
		}
	}

	function getWindowId(desktopId) {
		if (_.isUndefined(windowNum))
			return state.getIn(['widgets', desktopId.toString(), 'focusCurrentId']);
		else if (windowNum === '$')
			return state.getIn(['widgets', desktopId.toString(), 'childIds']).last();
		else {
			if (_.isString(windowNum))
				windowNum = parseInt(windowNum);
			return state.getIn(['widgets', desktopId.toString(), 'childIds']).get(desktopNum - 1);
		}
	}

	if (_.isEqual(l, [0, 0, 0])) {
		const screenId = getScreenId();
		const desktopId = getDesktopId(screenId);
		const windowId = getWindowId(desktopId);
		return {windowId};
	}
	else if (_.isEqual(l, [0, 0, 1])) {
		const screenId = getScreenId();
		const desktopId = getDesktopId(screenId);
		const windowId = getWindowId(desktopId);
		return {windowId};
	}
	else if (_.isEqual(l, [0, 1, 0]) || _.isEqual(l, [1, 1, 0])) {
		const desktopId = getDesktopId();
		return {desktopId};
	}
	else if (_.isEqual(l, [0, 1, 1]) || _.isEqual(l, [1, 1, 1])) {
		const desktopId = getDesktopId();
		const windowId = getWindowId(desktopId);
		return {windowId};
	}
	else if (_.isEqual(l, [1, 0, 0])) {
		const screenId = getScreenId();
		return {screenId};
	}
	else if (_.isEqual(l, [1, 0, 1])) {
		const screenId = getScreenId();
		const desktopId = getDesktopId(screenId);
		const windowId = getWindowId(desktopId);
		return {windowId};
	}

	console.log(spec);
	console.log(l);
}

export function move(state, action) {
	const {from: from0, to: to0} = action;
	const from1 = expandObjectSpec(state, from0 || {});
	const to1 = expandObjectSpec(state, to0);
	if (_.isNumber(from1.windowId)) {
		const id = from1.windowId;
		if (_.isNumber(to1.desktopId)) {
			const desktopId0 = getWidgetDesktopId(state, from1.windowId);
			if (desktopId0 !== to1.desktopId) {
				const childIds0 = state.getIn(['widgets', desktopId0.toString(), 'childIds']);
				const childIndex0 = childIds0.indexOf(id);
				state = state
					// Remove from old desktop
					.deleteIn(['widgets', desktopId0.toString(), 'childIds', childIndex0])
					// Add to new desktop
					.updateIn(
						['widgets', to1.desktopId.toString(), 'childIds'],
						List(),
						(childIds) => childIds.unshift(id)
					)
					.setIn(['widgets', id.toString(), 'parentId'], to1.desktopId);
				// Update focus of old desktop
				console.log({childIds0, childIndex0})
				if (childIds0.count() <= 1)
					state = state.deleteIn(['widgets', desktopId0.toString(), 'focusCurrentId']);
				else {
					const childIndex1 = (childIndex0 == childIds0.count() - 1)
						? childIndex0 - 1 : childIndex0 + 1;
					const childId1 = childIds0.get(childIndex1);
					console.log({childIndex1, childId1})
					state = state.setIn(['widgets', desktopId0.toString(), 'focusCurrentId'], childId1);
				}
				// Move focus with the window
				if (true) {
					const desktopId1 = to1.desktopId;
					// FIXME: increment this value once activateDesktop is changed to activate with 1-indexed numbers
					const desktopNum1 = state.get('desktopIds').indexOf(desktopId1);
					state = state.setIn(['widgets', desktopId1.toString(), 'focusCurrentId'], id);
					state = activateDesktop(state, {num: desktopNum1});
				}
				//state = updateFocus(state, id);
				state = updateLayout(state);
				state = updateX11(state);
				//console.log("move:")
				//console.log(JSON.stringify(state.toJS(), null, '\t'))
				return state;
			}
		}
	}

	logger.error("unrecognized combination:");
	logger.error({from: from1, to: to1});
	return state;
}
*/

export function moveWindowToDesktop(state, action) {
	//console.log({action})
	const {desktop: desktopNum} = action;
	const desktopId0 = State.getCurrentDesktopId(state);
	const id = State.getCurrentWindowId(state);
	const desktopId = state.getIn(['desktopIdOrder', desktopNum]);
	if (desktopId0 !== desktopId) {
		const doFocus = true;
		//console.log(state.getIn(['widgets', '0', ]))
		state = State.removeWindowFromDesktop(state, id);
		//console.log({id, desktopId, desktopId0})
		state = State.addWindowToDesktop(state, id, desktopId, undefined, (doFocus) ? 0 : undefined);
		// Move focus with the window
		if (doFocus) {
			state = activateDesktop(state, {num: desktopNum});
		}
		//state = updateFocus(state, id);
		state = updateLayout(state);
		state = updateX11(state);
		State.check(state);
		//console.log("move:")
		//console.log(JSON.stringify(state.toJS(), null, '\t'))
	}
	return state;
}

function moveWindowToIndexDir(state, action, next) {
	const {desktopId, windowId} = State.getCurrentScreenDesktopWindowIds(state);
	if (windowId >= 0) {
		const path = ['widgets', desktopId.toString(), 'childIdOrder'];
		const l = state.getIn(path);
		const i = l.indexOf(windowId);
		const j = (next)
			? (i + 1) % l.count()
			: (i == 0) ? l.count() - 1 : i - 1;
		state = State.insertUniqueId(state, windowId, path, j);
	}
	state = updateLayout(state);
	state = updateX11(state);
	State.check(state);
	return state;
}

export function moveWindowToIndexNext(state, action) {
	return moveWindowToIndexDir(state, action, true);
}

export function moveWindowToIndexPrev(state, action) {
	return moveWindowToIndexDir(state, action, false);
}

export function destroyWidget(state, action) {
	//console.log("destroyWidget: ", action);
	const id = action.id;
	assert(state);
	assert(_.isNumber(id));

	const w = state.getIn(['widgets', id.toString()]);
	//console.log(w)

	// Remove widget from desktop
	state = State.removeWindowFromDesktop(state, id);

	// Remove widget from screen
	// TODO: handle screen widgets
	const screenId = w.get('screenId');

	// Remove from widgets
	state = state.
		deleteIn(['widgets', id.toString()]).
		deleteIn(['x11', 'windowSettings', id.toString()]);

	// Remove from WM lists
	state = State.removeIdFromList(state, id, ['windowIdOrder']);
	state = State.removeIdFromList(state, id, ['windowIdStack']);

	state = updateLayout(state);
	state = updateX11(state);
	State.check(state);

	return state;
}

export function activateWindow(state, action) {
	const id = action.id;
	assert(_.isNumber(id));

	const w = State.getWidget(state, id);

	// Bring window to front of desktop stack
	const desktopId = State.getDesktopIdOfWidget(state, id);
	state = State.prependUniqueId(state, id, ['widgets', desktopId.toString(), 'childIdStack']);

	// Activate the desktop
	const desktopNum = state.get('desktopIdOrder').indexOf(desktopId);
	state = activateDesktop(state, {num: desktopNum});

	// Bring window to front of WM stack
	state = State.prependUniqueId(state, id, ['windowIdStack']);

	console.log({id, desktopId, desktopNum})

	state = updateLayout(state);
	state = updateX11(state);
	State.check(state);

	return state;
}

export function activateWindowNext(state, action) {
	return focus_moveDir(state, action, true);
}

export function focus_movePrev(state, action) {
	return focus_moveDir(state, action, false);
}

function focus_moveDir(state, action, next) {
	const id = _.get(action, 'id', State.getCurrentWindowId(state));
	//console.log({id})
	if (id >= 0) {
		const w = State.getWidget(state, id);
		const desktopId = State.getDesktopIdOfWidget(state, w);
		//console.log({desktopId})
		if (desktopId >= 0) {
			const childIds = state.getIn(['widgets', desktopId.toString(), 'childIdOrder'], List());
			const i = childIds.indexOf(id);
			assert(i >= 0);
			const j = (next)
				? (i + 1) % childIds.count()
				: (i == 0) ? childIds.count() - 1 : i - 1;
			//console.log({childIds, i, j})
			return activateWindow(state, {id: childIds.get(j)});
		}
	}
	return state;
}

function getWidgetDesktopId(state, w, id = -1) {
	if (_.isNumber(w)) {
		w = state.getIn(['widgets', w.toString()]);
	}
	if (w.has('screenId'))
		return id;
	else if (w.has('parentId')) {
		const parentId = w.get('parentId');
		return getWidgetDesktopId(state, state.getIn(['widgets', parentId.toString()]), parentId);
	}
	else
		return -1;
}

/*
function updateFocus(state, wid) {

	//console.log("updateFocus: "+wid)
	const screenId = state.get('screenCurrentId');
	const screen = state.getIn(['screens', screenId.toString()]);
	const desktopId = screen.get('desktopCurrentId');
	const widgets0 = state.get('widgets');
	const desktop0 = widgets0.get(desktopId.toString());
	const desktopChildIds0 = desktop0.get('childIds', List());
	//console.log(JSON.stringify(desktopChildren0.toJS()));
	//console.log(desktopChildren0.includes(wid));

	const focusCurrent0 = state.get('focusCurrentId', -1);
	const focusWidget0 = widgets0.get(focusCurrent0.toString());
	// If focus widget exists and is on the current screen: do nothing
	if (widgets0.has(focusCurrent0.toString()) && desktopChildIds0.includes(focusCurrent0)) {
		// Do nothing
		return state;
	}
	// Else if wid is on the current screen: set focus to wid
	else if (desktopChildIds0.includes(wid)) {
		const widget = widgets0.get(wid.toString());
		return state
			.setIn(['widgets', desktopId.toString(), 'focusCurrentId'], wid)
			.setIn(['focusCurrentId'], wid);
	}
	// Else if current desktop has a focus widget
	else if (desktop0.has('focusCurrentId')) {
		return state
			.setIn(['focusCurrentId'], desktop0.get('focusCurrentId'));
	}
	// Else, set focus to root of current screen
	else {
		return state
			//.deleteIn(['widgets', desktopId.toString(), 'focusCurrentId'])
			.deleteIn(['focusCurrentId']);
	}
}
*/

function updateLayout(state) {
	//console.log("updateLayout")
	//console.log(state)
	// For each screen, update desktop dimensions
	state.get('screens').forEach((screen, screenKey) => {
		// Screen dimensions
		const rc = [0, 0, screen.get('width'), screen.get('height')];
		// Dock layout
		screen.get('dockIds', List()).forEach(id => {
			const w = state.getIn(['widgets', id.toString()]);
			const gravity = w.get('dockGravity', 'bottom');
			const size = w.get('dockSize', 50);
			let rc2;
			switch (gravity) {
				case 'left':
				case 'right':
				case 'top':
					rc2 = [rc[0], rc[1], rc[2], size];
					rc[1] += size;
					rc[3] -= size;
					break;
				default:
					rc2 = [rc[0], rc[3] - size + 1, rc[2], size];
					rc[3] -= size;
					break;
			}
			state = state.setIn(['widgets', id.toString(), 'rc'], List(rc2));
		});
		// Desktop layout
		const desktopId = State.getCurrentDesktopId(state);
		state = state.setIn(['widgets', desktopId.toString(), 'rc'], List(rc));
	});

	const layoutEngines = {
		'tile-right': (desktopId) => layout_tileRight(state, desktopId),
		'default': (desktopId) => layout_mainLeft(state, desktopId)
	}
	// For each visible desktop, update child dimensions
	state.get('screenIdOrder').forEach(screenId => {
		const desktopId = State.getCurrentDesktopId(state, screenId);
		// FIXME: for debug only
		if (_.isUndefined(desktopId)) {
			console.log("updateLayout: ERROR")
			State.print(state);
		}
		// ENDFIX
		//state = layoutEngines[desktop.get('layout', 'default')](state, desktopId);
		state = layout_mainLeft(state, desktopId);
	});

	// For all non-visible desktops, hide the windows
	state.get('desktopIdOrder').forEach(desktopId => {
		// If this desktop is not on a screen:
		//console.log({desktopId})
		//console.log(state.hasIn(['widgets', desktopId.toString(), 'screenId']))
		//console.log(state.getIn(['widgets', desktopId.toString()]))
		//console.log(state.getIn(['widgets', desktopId.toString(), 'childIds']))
		if (!state.hasIn(['widgets', desktopId.toString(), 'screenId'])) {
			state.getIn(['widgets', desktopId.toString(), 'childIdOrder'], List()).forEach(childId => {
				state = state.setIn(['widgets', childId.toString(), 'visible'], false);
			});
		}
	});

	return state;
}

function layout_tileRight(state, desktopId) {
	const desktop = state.getIn(['widgets', desktopId.toString()]);
	const childIds = desktop.get('childIdOrder', List());
	let n = childIds.count();
	if (n > 0) {
		let [x, y, w, h] = desktop.get('rc');
		const padding = 5;
		x += padding;
		w -= 2 * padding;
		y += padding;
		h -= 2 * padding;
		const w2 = parseInt((w - (n - 1) * padding) / n);
		childIds.forEach((childId, i) => {
			const x2 = x + i * (w2 + padding);
			state = state.
				setIn(['widgets', childId.toString(), 'rc'], List.of(
					x2, y, w2, h
				)).
				setIn(['widgets', childId.toString(), 'visible'], true);
		});
	}
	return state;
}

function layout_mainLeft(state, desktopId) {
	assert(_.isNumber(desktopId), 'desktopId should be numeric: '+desktopId);
	const desktop = State.getDesktop(state, desktopId);
	const childIds = desktop.get('childIdOrder', List());
	let n = childIds.count();
	if (n == 1) {
		let [x, y, w, h] = desktop.get('rc');
		const padding = 5;
		x += padding;
		w -= 2 * padding;
		y += padding;
		h -= 2 * padding;
		const childId = childIds.get(0);
		state = state.
			setIn(['widgets', childId.toString(), 'rc'], List.of(x, y, w, h)).
			setIn(['widgets', childId.toString(), 'visible'], true);
	}
	else if (n > 1) {
		let [x, y, w, h] = desktop.get('rc');
		const padding = 5;
		x += padding;
		w -= 2 * padding;
		y += padding;
		h -= 2 * padding;
		const w2 = parseInt((w - 1 * padding) / 2);
		// Dimensions for main window, takes up left half of screen
		const mainId = childIds.get(0);
		state = state.
			setIn(['widgets', mainId.toString(), 'rc'], List.of(x, y, w2, h)).
			setIn(['widgets', mainId.toString(), 'visible'], true);
		// Remaining children take up right half of screen
		const x2 = x + (w2 + padding);
		const h2 = parseInt((h - (n-2)*padding) / (n - 1));
		childIds.shift().forEach((childId, i) => {
			const y2 = y + i * (h2 + padding);
			state = state.
				setIn(['widgets', childId.toString(), 'rc'], List.of(x2, y2, w2, h2)).
				setIn(['widgets', childId.toString(), 'visible'], true);
		});
	}
	return state;
}

const WM_STATE_WithdrawnState = 0;
const WM_STATE_NormalState = 1;
const WM_STATE_IconicState = 3;

function updateX11(state) {
	const screen = State.getCurrentScreen(state);
	const desktop = State.getCurrentDesktop(state);
	const focusCurrentId = desktop.getIn(['childIdStack', 0]);
	const focusCurrentKey = (focusCurrentId >= 0) ? focusCurrentId.toString() : undefined;
	state.get('widgets').forEach((w, key) => {
		const xid = w.get('xid');
		const isVisible = w.get('visible', false);
		if (xid >= 0) {
			const hasFocus = (key === focusCurrentKey);
			const info = {
				xid: xid,
				visible: isVisible,
				ewmh: {
					'WM_STATE': {
						state: (isVisible) ? WM_STATE_NormalState : WM_STATE_IconicState,
						icon: 0
					}
				}
			};
			if (info.visible) {
				const desktopId = getWidgetDesktopId(state, w);
				const desktop = state.getIn(['widgets', desktopId.toString()]);
				const screenId = (desktop) ? desktop.get('screenId') : w.get('screenId');
				const screenX11 = state.getIn(['x11', 'screens', screenId.toString()], Map());
				const windowType = w.get('type');
				const borderWidth = _.get({
					'desktop': 0,
					'dock': 0,
					'window': 5,
				}, windowType, 1);
				const color = (hasFocus)
					? screenX11.getIn(['colors', 'focus'], 0)
					: screenX11.getIn(['colors', 'normal'], 0);
				const rc = w.get('rc', List([0, 0, 0, 0])).toJS();
				const eventMask = _.get({
					'desktop': undefined,
					'dock': undefined,
				}, windowType, x11.eventMask.EnterWindow);

				info.desktopNum = state.get('desktopIdOrder').indexOf(desktopId);
				info.ChangeWindowAttributes = [
					xid,
					_.merge({}, {
						borderPixel: color,
						eventMask: eventMask
					})
				];
				info.ConfigureWindow = [
					xid,
					{
						x: rc[0],
						y: rc[1],
						width: rc[2] - 2*borderWidth,
						height: rc[3] - 2*borderWidth,
						borderWidth: borderWidth,
						stackMode: (windowType === 'DESKTOP') ? 1 : 0
					}
				];
				info.ewmh['_NET_WM_DESKTOP'] = (windowType === 'window')
					? [info.desktopNum]
					: [0xFFFFFFFF];
				/*if (windowType === 'dock') {
					console.log("dockInfo:")
					console.log(w)
					console.log(info.ConfigureWindow[1])
				}*/
			}

			state = state.mergeIn(['x11', 'windowSettings', key], fromJS(info));
		}
	});

	// If no widget is focused, set focus to the root window of the current screen
	const focusXid = (focusCurrentId >= 0)
		? state.getIn(['widgets', focusCurrentId.toString(), 'xid'])
		: screen.get('xidRoot');
	//console.log({focusCurrentId, focusCurrentKey, focusXid, screenCurrentId});
	state = state.updateIn(['x11', 'wmSettings', 'SetInputFocus'], l => {
		if (l) return l.set(0, focusXid);
		else return List.of(focusXid);
	});

	// EWMH (Extended window manager hints)
	if (true) {
		// Number of desktops
		const desktopCount = state.get('desktopIdOrder').count();
		state = state.updateIn(
			['x11', 'wmSettings', 'ewmh', '_NET_NUMBER_OF_DESKTOPS'],
			List.of(1),
			l => l.set(0, desktopCount)
		);
		// Current desktop
		const desktopId = State.getCurrentDesktopId(state);
		const desktopNum = state.get('desktopIdOrder').indexOf(desktopId);
		state = state.updateIn(
			['x11', 'wmSettings', 'ewmh', '_NET_CURRENT_DESKTOP'],
			List.of(0),
			l => l.set(0, desktopNum)
		);
		// Window order
		const windowIdOrder = state.get('windowIdOrder');
		state = state.updateIn(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST'], List(), l => l.setSize(windowIdOrder.count()));
		for (let i = 0; i < windowIdOrder.count(); i++) {
			const xid = state.getIn(['widgets', windowIdOrder.get(i).toString(), 'xid']);
			if (xid)
				state = state.setIn(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST', i], xid);
		}
		// Window stacking
		const windowIdStack = state.get('windowIdStack');
		state = state.updateIn(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST_STACKING'], List(), l => l.setSize(windowIdStack.count()));
		for (let i = 0; i < windowIdStack.count(); i++) {
			const xid = state.getIn(['widgets', windowIdStack.get(i).toString(), 'xid']);
			if (xid)
				state = state.setIn(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST_STACKING', i], xid);
		}
	}

	return state;
}
