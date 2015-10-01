import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';
import Immutable from 'immutable';
//import diff from 'immutablediff';
import x11 from 'x11';

export const empty = Map();

/*
export const actions = {
	'focus.moveTo': {
		build: function(id) { return {type: 'focus.moveTo', id: id}; },
		run: function(state, params) { return focus_moveTo(state, params.id); }
	},
	'focus.moveNext': {
		build: function() { return {type: 'focus.moveNext'}; },
		run: function(state, params) { return focus_moveNext(state); }
	},
	'focus.movePrev': {
		build: function() { return {type: 'focus.movePrev'}; },
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
		desktops.push({type: "desktop", layout: "tile-right"});
	}

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
		desktopIds: _.range(0, desktops.length),
		screenCurrentId: 0,
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

export function widget_add(state, action) {
	const w = action.widget;
	assert(state);
	assert(w);

	const screenId = state.get('screenCurrentId');
	const screen = state.getIn(['screens', screenId.toString()]);
	const desktopId = screen.get('desktopCurrentId');
	const widgets0 = state.get('widgets');
	const id = state.get('widgetIdNext');
	const w1 = Map(w).merge({
		parentId: desktopId,
		visible: true
	});
	//console.log(1)
	//console.log(state.get('widgets'));
	state = state.updateIn(
		['widgets', desktopId.toString(), 'childIds'],
		List(),
		childIds => childIds.push(id)
	).setIn(['widgets', id.toString()], w1).set('widgetIdNext', id + 1);
	state = updateFocus(state, id);
	state = updateLayout(state);
	state = updateX11(state);

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
			.setIn(['focusCurrentId'], wid)
	}
	// Else, set focus to root of current screen
	else {
		return state
			.deleteIn(['widgets', desktopId.toString(), 'focusCurrentId'])
			.deleteIn(['focusCurrentId'])
	}
}

function updateLayout(state) {
	//console.log("updateLayout")
	//console.log(state)
	// For each screen, update desktop dimensions
	state.get('screens').forEach((screen, screenId) => {
		const desktopId = screen.get('desktopCurrentId');
		const state1 = state.setIn(['widgets', desktopId.toString(), 'rc'], List.of(0, 0, screen.get('width'), screen.get('height')));
		state = state1
	});

	// For each visible desktop, update child dimensions
	state.get('screens').forEach((screen, screenId) => {
		const desktopId = screen.get('desktopCurrentId');
		const desktop = state.getIn(['widgets', desktopId.toString()]);
		if (true || desktop.get('layout', 'tile-right') === 'tile-right') {
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
		}
	});

	// For all non-visible desktops, hide the windows
	state.get('widgets').forEach((w, id) => {
		if (!w.has('parentId') && !w.has('screenId')) {
			w.get('childIds', List()).forEach(childId => {
				state = state.setIn(['widgets', childId.toString(), 'visible'], false);
			})
		}
	});

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
				visible: w.get('visible')
			};
			if (info.visible) {
				const desktopId = getWidgetDesktopId(state, w);
				const desktop = state.getIn(['widgets', desktopId.toString()]);
				const screenId = desktop.get('screenId');
				const screenX11 = state.getIn(['x11', 'screens', screenId.toString()], Map());
				const borderWidth = 5;
				const color = (hasFocus)
					? screenX11.getIn(['colors', 'focus'], 0)
					: screenX11.getIn(['colors', 'normal'], 0);
				const rc = w.get('rc', List([0, 0, 0, 0])).toJS();
				const windowType = w.get('windowType');
				const eventType = _.get({
					'DESKTOP': undefined,
					'DOCK': undefined,
				}, windowType, x11.eventMask.EnterWindow | x11.eventMask.VisibilityChange);

				info.desktopNum = state.get('desktopIds').indexOf(desktopId);
				info.ChangeWindowAttributes = [
					xid,
					_.merge({}, {
						borderPixel: color,
						eventMask: x11.eventMask.EnterWindow
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
			}

			state = state.mergeIn(['x11', 'windowSettings', key], fromJS(info));
		}
	});

	// If no widget is focused, set focus to the root window of the current screen
	const screenCurrentId = state.get('screenCurrentId');
	const focusXid = (focusCurrentId >= 0)
		? state.getIn(['widgets', focusCurrentKey, 'xid'])
		: state.getIn(['screens', screenCurrentId.toString(), 'xidRoot']);
	state = state.updateIn(['x11', 'wmSettings', 'SetInputFocus'], l => {
		if (l) return l.set(0, focusXid);
		else return List.of(focusXid);
	});

	return state;
}
