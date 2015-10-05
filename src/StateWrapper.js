import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';

const listRemove = (l, x) => l.filter(a => a !== x);

class ListWrapper {
	constructor(top, path) {
		this.top = top;
		this.path = path;
	}

	push(x) { this.top.updateIn(this.path, List(), l => l.push(x)); return this; }
	unshift(x) { this.top.updateIn(this.path, List(), l => l.push(x)); return this; }
	insert(x, index) { this.top.updateIn(this.path, List(), l => l.push(x)); return this; }
	remove(x) { this.top.updateIn(this.path, List(), l => listRemove(l, x)); return this; }
}

class UniqueListWrapper {
	constructor(top, path) {
		this.top = top;
		this.path = path;
	}

	getState(x) { return this.top.getIn(this.path); }
	push(x) { this.top.updateIn(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	unshift(x) { this.top.updateIn(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	insert(x, index) { this.top.updateIn(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	remove(x) { this.top.updateIn(this.path, List(), l => listRemove(l, x)); return this; }
}

export default class StateWrapper {
	constructor(state) {
		this.state = state;
	}

	get desktopIdOrder() { return new UniqueListWrapper(this, ['desktopIdOrder']); }
	get desktopIdStack() { return new UniqueListWrapper(this, ['desktopIdStack']); }

	getIn(path, dflt) {
		return this.state.getIn(path, dflt);
	}

	setIn(path, value) {
		this.state = this.state.setIn(path, value);
		return this;
	}

	updateIn(path, dflt, fn) {
		//console.log({path, dflt, fn})
		this.state = this.state.updateIn(path, dflt, fn);
		return this;
	}

	getState() { return this.state; }
	getCurrentScreenId() { return this.state.getIn(['screenIdStack', 0]); }

	addDesktop(w) {
		w = fromJS(w);
		// Default values
		w = fromJS({
			type: "desktop",
			layout: "default",
			childIdOrder: [],
			childIdStack: [],
			childIdRecent: []
		}).merge(w);

		const id = this.state.get('widgetIdNext', 0);
		this.state = this.state.setIn(['widgets', id.toString()], w);

		// Increment ID counter
		this.state = this.state.setIn('widgetIdNext', id + 1);

		return id;
	}
	/*
	createWidget(w, desktopId, widgetNum) {
		w = fromJS(w);

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
		else if (w.type === 'background') {
			// If a background is already set:
			if (state.hasIn(['screens', screenId.toString(), 'backgroundId'])) {
				// treat it like a normal window
				w1.set('type', 'window');
				state = createWindow(state, w1, id);
			}
			// Else, it's a background:
			else {
				w1 = w1.merge({
					screenId: screenId,
					visible: true
				});
				// Add dock to screen and to widget list
				state = state
					.setIn(
						['screens', screenId.toString(), 'backgroundId'],
						id
					)
					.setIn(['widgets', id.toString()], w1);
			}
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
	*/
};
