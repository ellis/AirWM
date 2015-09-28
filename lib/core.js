import {Map} from 'immutable';

export function setContainers(state, containers) {
	return state.set('containers', Map(containers));
}

export function setScreens(state, screens) {
	return state.set('screens', Map(screens));
}
