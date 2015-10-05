import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';

export const initialState = fromJS({
	widgetIdNext: 0,
	screenIdOrder: [],
	screenIdChain: [],
	desktopIdOrder: [],
	desktopIdChain: [],
	windowIdOrder: [],
	windowIdChain: [],
});

const listRemove = (l, x) => l.filter(a => a !== x);

class SubWrapper {
	constructor(top, path, dflt) {
		this.top = top;
		this.path = path;
		this.dflt = dflt;
	}

	getState(x) { return this.top._get(this.path, this.dflt); }

	_get(path, dflt) {
		if (!_.isArray(path))
			path = [path];
		return this.top._get(this.path.concat(path), dflt);
	}

	_set(path, value) {
		if (!_.isArray(path))
			path = [path];
		return this.top._set(this.path.concat(path), value);
	}
}

class DesktopWrapper extends SubWrapper {
	constructor(top, path) {
		super(top, path, Map());
		//console.log({top: this.top, path: this.path})
		assert.equal(this.top._get(this.path.concat(['type'])), 'desktop');
	}

	get type() { return "desktop"; }
	get layout() { return this._get('type', 'default'); }
	get screenId() { return this._get('screenId', -1); }
	getChildIdOrder() { return this._get('childIdOrder', List()); }
	getChildIdChain() { return this._get('childIdChain', List()); }
	getChildIdStack() { return this._get('childIdStack', List()); }

	_childIdOrder() { return new UniqueListWrapper(this.top, this.path.concat(['childIdOrder'])); }
	_childIdChain() { return new UniqueListWrapper(this.top, this.path.concat(['childIdChain'])); }
	_childIdStack() { return new UniqueListWrapper(this.top, this.path.concat(['childIdStack'])); }
}

class ListWrapper extends SubWrapper {
	constructor(top, path) {
		super(top, path, List());
	}

	push(x) { this.top._updateIn(this.path, List(), l => l.push(x)); return this; }
	unshift(x) { this.top._updateIn(this.path, List(), l => l.push(x)); return this; }
	insert(x, index) { this.top._updateIn(this.path, List(), l => l.push(x)); return this; }
	remove(x) { this.top._updateIn(this.path, List(), l => listRemove(l, x)); return this; }
}

class ScreenWrapper extends SubWrapper {
	constructor(top, path) {
		super(top, path, Map());
	}

	get xid() { return this.top._get(this.path.concat(['xid']), -1); }
	get width() { return this.top._get(this.path.concat(['width']), 0); }
	get height() { return this.top._get(this.path.concat(['height']), 0); }

	getState(x) { return this.top._get(this.path, Map()); }
	getDesktopIdChain() { return this.top._get(this.path.concat(['desktopIdChain']), List()); }

	_desktopIdChain() { return new UniqueListWrapper(this.top, this.path.concat(['desktopIdChain'])); }
}

class UniqueListWrapper extends SubWrapper {
	constructor(top, path) {
		super(top, path, List());
	}

	push(x) { this.top._updateIn(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	unshift(x) { this.top._updateIn(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	insert(x, index) { this.top._updateIn(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	remove(x) { this.top._updateIn(this.path, List(), l => listRemove(l, x)); return this; }
}

export const StatePaths = {
	widgetIdNext: ['widgetIdNext'],
	screenIdOrder: ['screenIdChain'],
	screenIdChain: ['screenIdChain'],
	desktopIdOrder: ['desktopIdOrder'],
	desktopIdChain: ['desktopIdChain'],
}

export default class StateWrapper {
	constructor(state) {
		this.state = fromJS(state);

		this._screenIdOrder = new UniqueListWrapper(this, StatePaths.screenIdOrder);
		this._screenIdChain = new UniqueListWrapper(this, StatePaths.screenIdChain);
		this._desktopIdOrder = new UniqueListWrapper(this, StatePaths.desktopIdOrder);
		this._desktopIdChain = new UniqueListWrapper(this, StatePaths.desktopIdChain);
	}

	getState() { return this.state; }
	getWidgetIdNext() { return this.state.getIn(StatePaths.widgetIdNext, 0); }
	getScreenIdOrder() { return this.state.getIn(StatePaths.screenIdOrder, List()); }
	getScreenIdChain() { return this.state.getIn(StatePaths.screenIdChain, List()); }
	getDesktopIdOrder() { return this.state.getIn(StatePaths.desktopIdOrder, List()); }
	getDesktopIdChain() { return this.state.getIn(StatePaths.desktopIdChain, List()); }
	getCurrentScreenId() { return this.state.getIn(['screenIdChain', 0], 0); }

	screenById(screenId) { return new ScreenWrapper(this, ['widgets', screenId.toString()]); }
	desktopById(desktopId) { return new DesktopWrapper(this, ['widgets', desktopId.toString()]); }

	addDesktop(w) {
		w = fromJS(w);
		// Default values
		w = fromJS({
			type: "desktop",
			layout: "default",
			childIdOrder: [],
			childIdChain: [],
			childIdStack: [],
		}).merge(w);

		// Add widget to widgets list
		const id = this._addWidget(w);

		// Append to desktop lists
		this._desktopIdOrder.push(id);
		this._desktopIdChain.push(id);

		// Append to the visit list for all screens
		this.forEachScreen(screen => {
			screen._desktopIdChain.push(id);
		});

		return id;
	}

	addScreen(screen) {
		const desktopIdOrder0 = this.getDesktopIdOrder().toJS();
		const desktopIdVisibles = this.mapEachScreen(screen => screen.getCurrentDesktopId());
		const desktopIdHiddens = _.difference(desktopIdOrder0, desktopIdVisibles);

		// Figure out which desktop to display
		let desktopId;
		// If there aren't and free desktops to display on this screen:
		if (_.isEmpty(desktopIdHiddens)) {
			desktopId = addDesktop({});
		}
		else {
			desktopId = _.first(desktopIdHiddens);
		}

		// Chaining order for desktops
		const desktopIdChain = [desktopId].concat(_.without(desktopIdOrder0, desktopId));

		let w = fromJS(screen);
		// Default values
		w = fromJS({
			type: "screen",
			desktopIdChain
		}).merge(w);

		// Add widget to widgets list
		const id = this._addWidget(w);

		// Append to screen lists
		this._screenIdOrder.push(id);
		this._screenIdChain.push(id);

		// Set desktop's screenId
		//console.log({desktopId, desktop: this.desktopById(desktopId), id, klass: typeof this.desktopById(desktopId)})
		this.desktopById(desktopId)._set('screenId', id);

		return id;
	}

	forEachScreen(fn) {
		this.getScreenIdOrder().forEach(screenId => {
			const screen = screenById(screenId);
			fn(screen, screenId);
		});
	}

	mapEachScreen(fn) {
		const result = [];
		this.getScreenIdOrder().forEach(screenId => {
			const screen = screenById(screenId);
			result.push(fn(screen, screenId));
		});
		return result;
	}


	_get(path, dflt) {
		return this.state.getIn(path, dflt);
	}

	_set(path, value) {
		this.state = this.state.setIn(path, value);
		return this;
	}

	_updateIn(path, dflt, fn) {
		//console.log({path, dflt, fn})
		this.state = this.state.updateIn(path, dflt, fn);
		return this;
	}

	_addWidget(w) {
		// Add widget to widgets list
		const id = this.getWidgetIdNext();
		this.state = this.state.setIn(['widgets', id.toString()], w);

		// Increment ID counter
		this.state = this.state.setIn(StatePaths.widgetIdNext, id + 1);

		return id;
	}

	_getWidgetById(id) {
		return this.state.getIn(['widgets', id.toString()]);
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
