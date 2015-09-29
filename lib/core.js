import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';
import Immutable from 'immutable';
import diff from 'immutablediff';

export function initialize(desktops, screens) {
	assert(_.isArray(desktops));
	assert(_.isArray(screens));
	assert(screens.length > 0, "can't do anything without any screens");

	// TODO: check required parameters on screens (width, height)

	desktops = _.cloneDeep(desktops);
	// Add default desktops if necessary
	while (desktops.length < screens.length) {
		desktops.push({layout: "tile-right"});
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

	let state = Immutable.fromJS({
		widgets: _.zipObject(_.range(0, desktops.length), desktops),
		screens: _.zipObject(_.range(0, screens.length), screens),
		desktopIds: _.range(0, desktops.length),
		screenCurrentId: 0,
		x11: {
			desktopNum: 0
		}
	});
	state = updateFocus(state);
	state = updateLayout(state);
	return state;
}

export function addWidget(state, w) {
	const screenId = state.get('screenCurrentId');
	const screen = state.getIn(['screens', screenId.toString()]);
	const desktopId = screen.get('desktopCurrentId');
	const widgets0 = state.get('widgets');
	const id = widgets0.count();
	const desktop0 = widgets0.get(desktopId);
	const w1 = Map(w).merge({
		parentId: desktopId
	});
	//console.log(1)
	//console.log(state.get('widgets'));
	const state1 = state.updateIn(
		['widgets', desktopId.toString(), 'childIds'],
		List(),
		childIds => childIds.push(id)
	).setIn(['widgets', id.toString()], w1);
	const state2 = updateFocus(state1, id);
	const state3 = updateLayout(state2);
	return state3;
}

export function updateFocus(state, wid) {
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
			.setIn(['x11', 'focusXid'], widget.get('xid'))
	}
	// Else, set focus to root of current screen
	else {
		return state
			.deleteIn(['widgets', desktopId.toString(), 'focusCurrentId'])
			.deleteIn(['focusCurrentId'])
			.setIn(['x11', 'focusXid'], screen.get('xidRoot'));
	}
}

export function updateLayout(state) {
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
					state = state.setIn(['widgets', childId.toString(), 'rc'], List.of(
						x2, y, w2, h
					));
				});
			}
		}
	});

	return state;
}
