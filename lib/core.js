import _ from 'lodash';
import {List, Map} from 'immutable';

export function setContainers(state, containers) {
	return state.set('containers', Map(containers));
}

export function setScreens(state, screens) {
	return state.set('screens', Map(screens));
}

export function addWidget(state, w) {
	const screenId = state.get('screenCurrent');
	const screen = state.getIn(['screens', screenId.toString()]);
	const desktopId = screen.get('desktopCurrent');
	const widgets0 = state.get('widgets');
	const id = widgets0.count();
	const desktop0 = widgets0.get(desktopId);
	const w1 = Map(w).merge({
		parent: desktopId
	});
	//console.log(1)
	//console.log(state.get('widgets'));
	const state1 = state.updateIn(['widgets', desktopId.toString(), 'children'], children => {
		return (children || List()).push(id);
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
	// If focus widget exists and is on the current screen: do nothing
	if (widgets0.has(focusCurrent0.toString()) && desktopChildren0.includes(focusCurrent0)) {
		// Do nothing
		return state;
	}
	// Else if wid is on the current screen: set focus to wid
	else if (desktopChildren0.includes(wid)) {
		const widget = widgets0.get(wid.toString());
		return state
			.setIn(['widgets', desktopId.toString(), 'focusCurrent'], wid)
			.setIn(['focusCurrent'], wid)
			.setIn(['x11', 'focusXid'], widget.get('xid'))
	}
	// Else, set focus to root of current screen
	else {
		return state
			.deleteIn(['widgets', desktopId.toString(), 'focusCurrent'])
			.deleteIn(['focusCurrent'])
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
	CONTINUE: calculate layout for tile-right
	desktopChildren0.forEach((value, index) => {
		const child = widgets0.get(childId.toString());
		state1 =
	});
}
