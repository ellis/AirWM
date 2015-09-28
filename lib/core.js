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
	return state1;
}
