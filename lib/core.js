import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';
import Immutable from 'immutable';

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
		_.merge(desktops[i], {
			screenId: i,
			width: screens[i].width,
			height: screens[i].height
		});
	}
	// Make sure other desktops don't have screen assignment
	for (let i = screens.length; i < desktops.length; i++) {
		delete desktops[i].screenId;
	}

	return Immutable.fromJS({
		widgets: _.zipObject(_.range(0, desktops.length), desktops),
		screens: _.zipObject(_.range(0, screens.length), screens),
		desktopIds: _.range(0, desktops.length),
		screenCurrentId: 0,
		x11: {
			desktopNum: 0,
			focusXid: screens[0].xidRoot
		}
	});
}

export function setContainers(state, containers) {
	return state.set('containers', Map(containers));
}

export function setScreens(state, screens) {
	return state.set('screens', Map(screens));
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
	const state1 = state.updateIn(['widgets', desktopId.toString(), 'childIds'], childIds => {
		return (childIds || List()).push(id);
	}).update('widgets', widgets => {
		//console.log(2)
		//console.log(widgets);
		return widgets.set(id.toString(), w1);
	});
	const state2 = updateFocus(state1, id);
	return state2;
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

	const focusCurrent0 = state.get('focusCurrent', -1);
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
	const screenId = state.get('screenCurrent');
	const screen = state.getIn(['screens', screenId.toString()]);
	const desktopId = screen.get('desktopCurrent');
	const widgets0 = state.get('widgets');
	const desktop0 = widgets0.get(desktopId.toString());
	const desktopChildren0 = desktop0.get('children', List());
	//console.log(JSON.stringify(desktopChildren0.toJS()));
	//console.log(desktopChildren0.includes(wid));

	const focusCurrent0 = state.get('focusCurrent', -1);
	const focusWidget0 = widgets0.get(focusCurrent0.toString());

	let state1 = state;
	/*CONTINUE: calculate layout for tile-right
	desktopChildren0.forEach((value, index) => {
		const child = widgets0.get(childId.toString());
		state1 =
	});*/
}
