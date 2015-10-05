import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';

export const initialState = fromJS({
	widgetIdNext: 0,
	screenIdOrder: [],
	screenIdVisit: [],
	desktopIdOrder: [],
	desktopIdVisit: [],
	windowIdOrder: [],
	windowIdVisit: [],
});

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

export const StatePaths = {
	widgetIdNext: ['widgetIdNext'],
	screenIdVisit: ['screenIdVisit'],
	desktopIdOrder: ['desktopIdOrder'],
	desktopIdVisit: ['desktopIdVisit'],
}

export default class StateWrapper {
	constructor(state) {
		this.state = fromJS(state);

		this._desktopIdOrder = new UniqueListWrapper(this, StatePaths.desktopIdOrder);
		this._desktopIdVisit = new UniqueListWrapper(this, StatePaths.desktopIdVisit);
	}

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
	getWidgetIdNext() { return this.state.getIn(StatePaths.widgetIdNext, 0); }
	getScreenIdOrder() { return this.state.getIn(StatePaths.screenIdOrder, List()); }
	getScreenIdVisit() { return this.state.getIn(StatePaths.screenIdVisit, List()); }
	getDesktopIdOrder() { return this.state.getIn(StatePaths.desktopIdOrder, List()); }
	getDesktopIdVisit() { return this.state.getIn(StatePaths.desktopIdVisit, List()); }
	getCurrentScreenId() { return this.state.getIn(['screenIdVisit', 0], 0); }

	addDesktop(w) {
		w = fromJS(w);
		// Default values
		w = fromJS({
			type: "desktop",
			layout: "default",
			childIdOrder: [],
			childIdVisit: [],
			childIdStack: [],
		}).merge(w);

		// Add widget to widgets list
		const id = this.getWidgetIdNext();
		this.state = this.state.setIn(['widgets', id.toString()], w);
		//console.log(2)
		//console.log(this.state);

		// Increment ID counter
		this.state = this.state.setIn(StatePaths.widgetIdNext, id + 1);
		//console.log(3)
		//console.log(this.state);

		// Append to desktop lists
		this._desktopIdOrder.push(id);
		this._desktopIdVisit.push(id);
		//console.log(4)
		//console.log(this.state);

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
