import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';
import Immutable from 'immutable';
//import diff from 'immutablediff';
import x11 from 'x11';

export const empty = Map();


function statePrint(state) {
	console.log(JSON.stringify(state.toJS(), null, '\t'));
}

const stateGetScreen = (state, screenId) => state.getIn(['screens', screenId.toString()]);
const stateGetCurrentScreenId = (state) => state.getIn(['screenIdStack', 0]);
const stateGetCurrentScreen = (state) => stateGetScreen(state, stateGetCurrentScreenId(state));

const stateGetWidget = (state, id) => state.getIn(['widgets', id.toString()]);

const stateGetDesktop = stateGetWidget;
/**
 * Get ID of current desktop.
 * @param {object} state - current state.
 * @param {number} [screenId] - If screen ID is passed, find the current desktop ID on that screen.
 * @return {number} ID of current desktop or current desktop on a given screen.
 */
const stateGetCurrentDesktopId = (state, screenId) =>
	(_.isUndefined(screenId))
		? state.getIn(['desktopIdStack', 0])
		: state.getIn(['screens', screenId.toString(), 'desktopIdStack', 0]);
const stateGetCurrentDesktop = (state, screenId) =>
	stateGetDesktop(state, stateGetCurrentDesktopId(state, screenId));

const stateGetWindow = stateGetWidget;
//const stateGetCurrentWindow

function stateInsertWindowOnDesktop(state, w, id, desktopId, order, stack = 1) {
	return state
		.setIn(['widgets', id.toString()], w.set('parentId', desktopId))
		.updateIn(
			['widgets', desktopId.toString(), 'childIdOrder'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				if (order >= l.count()) return l.push(id);
				else if (_.isNumber(order)) return l.splice(order, 0, id);
				else return l.push(id);
			}
		)
		.updateIn(
			['widgets', desktopId.toString(), 'childIdStack'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				if (stack >= l.count()) return l.push(id);
				else if (_.isNumber(stack)) return l.splice(stack, 0, id);
				else return l.unshift(id);
			}
		);
}

function stateSetScreenDesktop(state, screenId, desktopId) {
	assert(_.isNumber(screenId));
	assert(_.isNumber(desktopId));
	const desktopPrevId = state.getIn(['screens', screenId.toString(), 'desktopIdStack', 0]);
	if (desktopId !== desktopPrevId) {
		state = state
			// Remove screen reference from the screen's previous desktop
			.deleteIn(['widgets', desktopIdPrev.toString(), 'screenId'])
			// Set screen reference in new desktop
			.setIn(['widgets', desktopId.toString(), 'screenId'], screenId)
			// Put desktop at head of screen's stack
			.updateIn(
				['screens', screenId.toString(), 'desktopIdStack'],
				List(),
				l => l.unshift(desktopId)
			);
	}
	return state;
}

function stateUpdateWindowStacks(state, id) {
	assert(_.isNumber(id));
	const desktopId = getWidgetDesktopId(state, id);
	assert(_.isNumber(desktopId));
	return state
		.updateIn(
			['windowIdStack'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				return l.unshift(id);
			}
		)
		.updateIn(
			['widgets', desktopId.toString(), 'childIdStack'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				return l.unshift(id);
			}
		);
}

function stateCheck(state) {
	// Each screen has a desktop, and that desktop references the screen
	state.get('screen').forEach((screen, key) => {
		const screenId = parseInt(key);
		const desktopId = screen.getIn(['desktopIdStack', 0]);
		assert(_.isNumber(desktopId));
		assert(state.getIn(['widgets', desktopId.toString(), 'screenId']) === screenId);
	});

	// Desktops and their children
	state.get('desktopIdOrder').forEach(desktopId => {
		const desktop = stateGetDesktop(state, desktopId);
		const childIdOrder = desktop.get('childIdOrder');
		const childIdStack = desktop.get('childIdStack');
		// childIdStack is a permutation of childIdOrder
		assert(childIdOrder.isSubset(childIdStack) && childIdStack.isSubset(childIdOrder));
		// Each child references this desktop
		childIdOrder.forEach(childId => {
			assert(stateGetWindow(state, childId).get('parentId') === desktopId);
		})
	});
}

/*
export const actions = {
	'activateWindow': {
		build: function(id) { return {type: 'activateWindow', id: id}; },
		run: function(state, params) { return focus_moveTo(state, params.id); }
	},
	'activateWindowNext': {
		build: function() { return {type: 'activateWindowNext'}; },
		run: function(state, params) { return focus_moveNext(state); }
	},
	'activateWindowPrev': {
		build: function() { return {type: 'activateWindowPrev'}; },
		run: function(state, params) { return focus_moveNext(state); }
	}
}
*/

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

	// TODO: allow for initial assignment of desktops to screens rather
	//  than forcing the first desktops to be assigned in order.
	// Assign desktops to screens
	for (let i = 0; i < screens.length; i++) {
		screens[i].desktopCurrentId = i;
		desktops[i].screenId = i;
	}
	// Make sure other desktops don't have screen assignment
	for (let i = screens.length; i < desktops.length; i++) {
		delete desktops[i].screenId;
	}

	desktops.forEach(w => { w.type = "desktop"; });

	let state = Immutable.fromJS({
		widgets: _.zipObject(_.range(0, desktops.length), desktops),
		screens: _.zipObject(_.range(0, screens.length), screens),
		widgetIdNext: desktops.length,
		screenIdOrder: _.range(0, screens.length),
		screenIdStack: _.range(0, screens.length),
		desktopIdOrder: _.range(0, desktops.length),
		desktopIdStack: _.range(0, desktops.length),
		windowIdOrder: [],
		windowIdStack: [],
		x11: {
			desktopNum: 0
		}
	});
	state = updateFocus(state);
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
		const screenId = stateGetCurrentScreenId(state);
		// Current desktop of the target screen
		const desktopIdOld = stateGetCurrentDesktopId(state, screenId);
		// If a desktop change is actually requested for the current screen.
		if (desktopId !== desktopIdOld) {
			state = stateSetScreenDesktop(state, screenId, desktopId);
			// If desktop was on another screen, swap desktops.
			if (screenIdOld >= 0)
				state = stateSetScreenDesktop(state, screenIdOld, desktopIdOld);
			// Update the focus window
			const focusCurrentId = state.getIn(['widgets', desktopId.toString(), 'focuseCurrentId']);
			if (focusCurrentId >= 0)
				state.setIn(['focuseCurrentId'], focuseCurrentId);
			else
				state.deleteIn(['focuseCurrentId']);

			state = updateFocus(state);
			state = updateLayout(state);
			state = updateX11(state);
			stateCheck(state);
		}
	}

	return state;
}

export function createWidget(state, action) {
	const w = action.widget;
	assert(state);
	assert(w);

	const screenId = stateGetCurrentScreenId(state);
	const screen = stateGetCurrentScreen(state, screenId);
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
		const desktopId = stateGetCurrentDesktopId(state, screenId);
		w1 = w1.merge({
			parentId: desktopId,
			visible: true
		});
		//console.log(1)
		//console.log(state.get('widgets'));
		// Add widget to desktop
		state = stateInsertWindow(state, w1, id, desktopId, 1, 1);
	}

	// Add widget and increment widgetIdNext
	state = state.set('widgetIdNext', id + 1);

	state = updateFocus(state, id);
	state = updateLayout(state);
	state = updateX11(state);

	return state;
}

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
					const desktopNum1 = state.get('desktopIds').indexOf(desktopId1)/* + 1*/;
					state = state.setIn(['widgets', desktopId1.toString(), 'focusCurrentId'], id);
					state = activateDesktop(state, {num: desktopNum1});
				}
				state = updateFocus(state, id);
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

export function widget_remove(state, action) {
	const id = action.id;
	assert(state);
	assert(_.isNumber(id));

	const w = state.getIn(['widgets', id.toString()]);
	//console.log(w)

	// Remove widget from desktop focus
	const desktopId = getWidgetDesktopId(state, w);
	if (desktopId >= 0) {
		const focusCurrentId = state.getIn(['widgets', desktopId.toString(), 'focusCurrentId']);
		if (focusCurrentId === id) {
			state = focus_moveNext(state, {id});
			// If desktop didn't have any other widget to focus on, remove focus ID
			if (state.getIn(['widgets', desktopId.toString(), 'focusCurrentId']) === id) {
				state = state.deleteIn(['widgets', desktopId.toString(), 'focusCurrentId']);
				// Also check global focus:
				if (state.get('focusCurrentId') === id) {
					state = state.delete('focusCurrentId');
				}
			}
		}
	}

	// Remove widget from parent
	const parentId = w.get('parentId');
	const screenId = w.get('screenId');
	if (parentId >= 0) {
		state = state.updateIn(
			['widgets', parentId.toString(), 'childIds'],
			List(),
			childIds => childIds.delete(childIds.indexOf(id))
		);
	}
	else if (screenId >= 0) {
		// TODO: handle screen widgets
	}

	// Remove from widgets
	state = state.
		deleteIn(['widgets', id.toString()]).
		deleteIn(['x11', 'windowSettings', id.toString()]);

	state = updateLayout(state);
	state = updateX11(state);

	return state;
}

export function focus_moveTo(state, action) {
	const id = action.id;
	assert(_.isNumber(id));

	const key = id.toString();
	const focusOldId = state.get('focusCurrentId', -1);
	// If focus is changing
	if (focusOldId.toString() !== key) {
		// If focus was previously set
		if (focusOldId >= 0) {
			const focusOld = state.getIn(['widgets', focusOldId.toString()]);
			assert(focusOld);
			const desktopId = getWidgetDesktopId(state, focusOld);
			if (desktopId >= 0) {
				state = state.deleteIn(['widgets', desktopId.toString(), 'focusCurrentId'])
			}
		}

		// Remove old focus
		state = state.delete('focusCurrentId');

		// Set new focus
		const w = state.getIn(['widgets', key]);
		if (w) {
			const desktopId = getWidgetDesktopId(state, w);
			if (desktopId >= 0) {
				state = state.setIn(['widgets', desktopId.toString(), 'focusCurrentId'], id)
			}
			state = state.set('focusCurrentId', id);
		}
	}

	state = updateX11(state);

	return state;
}

export function focus_moveNext(state, action) {
	return focus_moveDir(state, action, true);
}

export function focus_movePrev(state, action) {
	return focus_moveDir(state, action, false);
}

function focus_moveDir(state, action, next) {
	const id = _.get(action, 'id', state.get('focusCurrentId'));
	//console.log({id})
	if (id >= 0) {
		const w = state.getIn(['widgets', id.toString()]);
		const desktopId = getWidgetDesktopId(state, w);
		//console.log({desktopId})
		if (desktopId >= 0) {
			const childIds = state.getIn(['widgets', desktopId.toString(), 'childIds'], List());
			const i = childIds.indexOf(id);
			assert(i >= 0);
			const j = (next)
				? (i + 1) % childIds.count()
				: (i == 0) ? childIds.count() - 1 : i - 1;
			//console.log({childIds, i, j})
			return focus_moveTo(state, {id: childIds.get(j)});
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

function updateLayout(state) {
	//console.log("updateLayout")
	//console.log(state)
	// For each screen, update desktop dimensions
	state.get('screens').forEach((screen, screenId) => {
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
		const desktopId = screen.get('desktopCurrentId');
		state = state.setIn(['widgets', desktopId.toString(), 'rc'], List(rc));
	});

	const layoutEngines = {
		'tile-right': (desktopId) => layout_tileRight(state, desktopId),
		'default': (desktopId) => layout_mainLeft(state, desktopId)
	}
	// For each visible desktop, update child dimensions
	state.get('screens').forEach((screen, screenId) => {
		const desktopId = screen.get('desktopCurrentId');
		const desktop = state.getIn(['widgets', desktopId.toString()]);
		//state = layoutEngines[desktop.get('layout', 'default')](state, desktopId);
		state = layout_mainLeft(state, desktopId);
	});

	// For all non-visible desktops, hide the windows
	state.get('desktopIds').forEach(desktopId => {
		// If this desktop is not on a screen:
		//console.log({desktopId})
		//console.log(state.hasIn(['widgets', desktopId.toString(), 'screenId']))
		//console.log(state.getIn(['widgets', desktopId.toString()]))
		//console.log(state.getIn(['widgets', desktopId.toString(), 'childIds']))
		if (!state.hasIn(['widgets', desktopId.toString(), 'screenId'])) {
			state.getIn(['widgets', desktopId.toString(), 'childIds'], List()).forEach(childId => {
				state = state.setIn(['widgets', childId.toString(), 'visible'], false);
			})
		}
	});

	return state;
}

function layout_tileRight(state, desktopId) {
	const desktop = state.getIn(['widgets', desktopId.toString()]);
	const childIds = desktop.get('childIds', List());
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
	const desktop = state.getIn(['widgets', desktopId.toString()]);
	const childIds = desktop.get('childIds', List());
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

function updateX11(state) {
	const focusCurrentId = state.get('focusCurrentId', -1);
	const focusCurrentKey = focusCurrentId.toString();
	state.get('widgets').forEach((w, key) => {
		const xid = w.get('xid');
		if (xid >= 0) {
			const hasFocus = (key === focusCurrentKey);
			const info = {
				xid: xid,
				visible: w.get('visible', false)
			};
			if (info.visible) {
				const desktopId = getWidgetDesktopId(state, w);
				const desktop = state.getIn(['widgets', desktopId.toString()]);
				const screenId = (desktop) ? desktop.get('screenId') : w.get('screenId');
				// FIXME: for debug only
				if (_.isUndefined(screenId)) {
					console.log(JSON.stringify(state.toJS(), null, '\t'))
				}
				// ENDFIX
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

				info.desktopNum = state.get('desktopIds').indexOf(desktopId);
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
	const screenCurrentId = state.get('screenCurrentId');
	const focusXid = (focusCurrentId >= 0)
		? state.getIn(['widgets', focusCurrentKey, 'xid'])
		: state.getIn(['screens', screenCurrentId.toString(), 'xidRoot']);
	//console.log({focusCurrentId, focusCurrentKey, focusXid, screenCurrentId});
	state = state.updateIn(['x11', 'wmSettings', 'SetInputFocus'], l => {
		if (l) return l.set(0, focusXid);
		else return List.of(focusXid);
	});

	return state;
}
