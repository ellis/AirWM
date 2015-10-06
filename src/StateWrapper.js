import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';

export const initialState = fromJS({
	widgetIdNext: 0,
	screenIdOrder: [],
	desktopIdOrder: [],
	windowIdOrder: [],
	widgetIdChain: [],
	currentScreenId: -1,
	currentDesktopId: -1,
	currentWindowId: -1,
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
	constructor(top, path, id) {
		super(top, path, Map());
		this.id = id;
		//console.log({top: this.top, path: this.path})
		assert.equal(this.top._get(this.path.concat(['type'])), 'desktop');
	}

	get type() { return "desktop"; }
	get layout() { return this._get('type', 'default'); }
	get parentId() { return this._get('parentId', -1); }
	getChildIdOrder() { return this._get('childIdOrder', List()); }
	getChildIdChain() { return this._get('childIdChain', List()); }
	//getChildIdStack() { return this._get('childIdStack', List()); }
	get currentWindowId() { return this._get(['childIdChain', 0], -1); }

	findScreenId() { return this._get('parentId', -1); }

	get _childIdOrder() { return new UniqueListWrapper(this.top, this.path.concat(['childIdOrder'])); }
	get _childIdChain() { return new UniqueListWrapper(this.top, this.path.concat(['childIdChain'])); }
	//_childIdStack() { return new UniqueListWrapper(this.top, this.path.concat(['childIdStack'])); }
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
	constructor(top, path, id) {
		super(top, path, Map());
		this.id = id;
	}

	get xid() { return this.top._get(this.path.concat(['xid']), -1); }
	get width() { return this.top._get(this.path.concat(['width']), 0); }
	get height() { return this.top._get(this.path.concat(['height']), 0); }

	get currentDesktopId() { return this._get(['desktopIdChain', 0], -1); }
	get currentDesktop() { return this.top.desktopById(this.currentDesktopId); }

	getDesktopIdChain() { return this._get('desktopIdChain', List()); }

	get _desktopIdChain() { return new UniqueListWrapper(this.top, this.path.concat(['desktopIdChain'])); }
}

class UniqueListWrapper extends SubWrapper {
	constructor(top, path) {
		super(top, path, List());
	}

	push(x) { this.top._updateIn(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	unshift(x) { this.top._updateIn(this.path, List(), l => listRemove(l, x).unshift(x)); return this; }
	insert(x, index) { this.top._updateIn(this.path, List(), l => listRemove(l, x).splice(index, 0, x)); return this; }
	remove(x) { this.top._updateIn(this.path, List(), l => listRemove(l, x)); return this; }
}

export const StatePaths = {
	widgetIdNext: ['widgetIdNext'],
	screenIdOrder: ['screenIdChain'],
	desktopIdOrder: ['desktopIdOrder'],
	windowIdOrder: ['windowIdOrder'],
	windowIdStack: ['windowIdStack'],
	widgetIdChain: ['widgetIdChain'],
	currentScreenId: ['currentScreenId'],
	currentDesktopId: ['currentDesktopId'],
	currentWindowId: ['currentWindowId']
}

export default class StateWrapper {
	constructor(state) {
		this.state = fromJS(state);

		this._screenIdOrder = new UniqueListWrapper(this, StatePaths.screenIdOrder);
		this._desktopIdOrder = new UniqueListWrapper(this, StatePaths.desktopIdOrder);
		this._windowIdOrder = new UniqueListWrapper(this, StatePaths.windowIdOrder);
		this._windowIdStack = new UniqueListWrapper(this, StatePaths.windowIdStack);
		this._widgetIdChain = new UniqueListWrapper(this, StatePaths.widgetIdChain);
	}

	clone() {
		return new StateWrapper(this.state);
	}

	print(path) {
		const x = (path) ? this.get(path) : this.state;
		console.log(JSON.stringify(x, null, '\t'));
	}

	getState() { return this.state; }
	getScreenIdOrder() { return this.state.getIn(StatePaths.screenIdOrder, List()); }
	getDesktopIdOrder() { return this.state.getIn(StatePaths.desktopIdOrder, List()); }
	getWindowIdOrder() { return this.state.getIn(StatePaths.windowIdOrder, List()); }
	getWidgetIdChain() { return this.state.getIn(StatePaths.widgetIdChain, List()); }
	//getScreenIdChain() { return this.state.getIn(StatePaths.screenIdChain, List()); }
	get widgetIdNext() { return this.state.getIn(StatePaths.widgetIdNext, 0); }
	get currentScreenId() { return this.state.getIn(StatePaths.currentScreenId, -1); }
	get currentDesktopId() { return this.state.getIn(StatePaths.currentDesktopId, -1); }
	get currentWindowId() { return this.state.getIn(StatePaths.currentWindowId, -1); }

	screenById(screenId) { return this._widgetById(ScreenWrapper, screenId); }
	desktopById(desktopId) { return this._widgetById(DesktopWrapper, desktopId); }

	get currentScreen() { return this.screenById(this.currentScreenId); }
	get currentDesktop() { return this.desktopById(this.currentDesktopId); }

	addDesktop(w) {
		w = fromJS(w);
		// Default values
		w = fromJS({
			type: "desktop",
			layout: "default",
			childIdOrder: [],
			childIdChain: [],
			//childIdStack: [],
		}).merge(w);

		// Add widget to widgets list
		const id = this._addWidget(w);

		// Append to desktop list
		this._desktopIdOrder.push(id);
		this._widgetIdChain.push(id);

		// Append to the visit list for all screens
		this.forEachScreen(screen => {
			screen._desktopIdChain.push(id);
		});

		return id;
	}

	addScreen(screen) {
		const desktopIdOrder0 = this.getDesktopIdOrder().toJS();
		// List of exisitng desktop which are on a screen
		const desktopIdVisibles = this.mapEachScreen(screen => screen.currentDesktopId);
		// List of exisitng desktop which aren't currently shown on any screen
		const desktopIdHiddens = _.difference(desktopIdOrder0, desktopIdVisibles);

		// Figure out which desktop to display
		let desktopId;
		// If there aren't and free desktops to display on this screen:
		if (_.isEmpty(desktopIdHiddens)) {
			// Create a new desktop for this screen.
			desktopId = this.addDesktop({});
		}
		// Otherwise, take the first hidden desktop
		else {
			desktopId = _.first(desktopIdHiddens);
		}

		// Chaining order for desktops, puts chosen desktop at front of list of all desktops
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
		this._widgetIdChain.push(id);

		// Set desktop's parentId
		//console.log({desktopId, desktop: this.desktopById(desktopId), id, klass: typeof this.desktopById(desktopId)})
		const desktop = this.desktopById(desktopId);
		desktop._set('parentId', id);

		// If this is the first screen, set it as current:
		if (this.currentScreenId < 0)
			this._setCurrent(id);

		return id;
	}

	/**
	 * Add a window to the state.
	 * It won't have a parent and will be put at the end of the window lists.
	 * @param {object} w - object describing a window
	 * @param {number} w.xid - the X11 window ID
	 * @returns ID of new window
	 */
	addWindow(w) {
		w = fromJS(w);
		// Default values
		w = fromJS({
			type: 'window',
			parentId: -1,
			state: {}
		}).merge(w);

		// Add widget to widgets list
		const id = this._addWidget(w);

		// Append to window lists
		this._windowIdOrder.push(id);
		this._windowIdStack.push(id);
		this._widgetIdChain.push(id);

		return id;
	}

	/**
	 * Remove window from desktop.  Window will not be visible.
	 *
	 * @param  {number} windowId
	 */
	unparentWindow(windowId) {
		// Find window's desktop
		const desktopId = this._findWidgetDekstopIdById(windowId);
		// Set window's parent to -1
		this._set(['widgets', windowId.toString(), 'parentId'], -1);
		// Remove window from desktop's window chain
		if (desktopId >= 0) {
			const desktop = this.desktopById(desktopId);
			desktop._childIdOrder.remove(windowId);
			desktop._childIdChain.remove(windowId);
			//desktop._childIdStack.remove(windowId);
			this._setCurrent();
		}
		return this;
	}

	moveDesktopToScreen(desktop, screen) {
		if (_.isNumber(desktop))
			desktop = this.desktopById(desktop);
		if (_.isNumber(screen))
			screen = this.screenById(screen);

		if (desktop && screen) {
			const screenPrev = this.screenById(desktop.findScreenId());
			const desktopPrev = this.desktopById(screen.currentDesktopId);
			// If the desktop was already displayed on another screen
			if (screenPrev && screenPrev.id !== screen.id) {
				// Move desktop on this screen to that screen
				desktopPrev._set('parentId', screenPrev.id);
				screenPrev._desktopIdChain.unshift(desktopPrev.id);
			}
			// Place desktop on screen
			desktop._set('parentId', screen.id);
			// Move desktop to head of screen's stack
			screen._desktopIdChain.unshift(desktop.id);
			// Update current pointers
			this._setCurrent();
		}
		return this;
	}

	moveWindowToDesktop(windowId, desktopId) {
		const desktop = this.desktopById(desktopId);
		// Add window to given desktop
		if (desktop) {
			// Remove window from old parent
			this.unparentWindow(windowId);
			// Set parent ID
			// TODO: use WindowWrapper method here once I create one
			this._set(['widgets', windowId.toString(), 'parentId'], desktopId);
			//console.log({desktopId, desktop})
			//console.log(desktop._childIdOrder)
			// Append to desktop's child list
			desktop._childIdOrder.push(windowId);
			desktop._childIdChain.push(windowId);
			//desktop._childIdStack.push(windowId);
			//console.log(1)
			//this.print()
			this._setCurrent();
			//console.log(2)
			//console.log(this.currentWindowId);
			//this.print()
		}
		return this;
	}

	activateScreen(screen) {
		this._setCurrent(screen);
		return this;
	}

	activateDesktop(desktop) {
		if (_.isNumber(desktop))
			desktop = this.desktopById(desktopId);
		if (desktop) {
			// If the desktop is already on a screen, activate that screen
			let screenId = desktop.findScreenId();
			if (screenId >= 0) {
				this._setCurrent(screenId);
			}
			// Otherwise, move the desktop to the current screen.
			else {
				this.moveDesktopToScreen(desktop, currentScreen);
				this._setCurrent();
			}
		}
		return this;
	}

	activateWindow(windowId) {
		// Find desktop
		const desktop = desktopById(this._findWidgetDekstopIdById(windowId));
		if (desktop) {
			// Move window to front on desktop's chain
			desktop._windowIdChain.unshift(windowId);
			// And activate the desktop
			this.activateDesktop(desktop);
		}
		//
		// Activate desktop
		return this;
	}

	forEachScreen(fn) {
		this.getScreenIdOrder().forEach(screenId => {
			const screen = screenById(screenId);
			fn(screen, screenId);
		});
		return this;
	}

	mapEachScreen(fn) {
		const result = [];
		this.getScreenIdOrder().forEach(screenId => {
			const screen = screenById(screenId);
			result.push(fn(screen, screenId));
		});
		return result;
	}

	/* Private helper functions */

	_has(path) {
		if (_.isString(path))
			path = [path];
		return this.state.hasIn(path);
	}

	_get(path, dflt) {
		if (_.isString(path))
			path = [path];
		return this.state.getIn(path, dflt);
	}

	_set(path, value) {
		if (_.isString(path))
			path = [path];
		this.state = this.state.setIn(path, value);
		return this;
	}

	_updateIn(path, dflt, fn) {
		if (_.isString(path))
			path = [path];
		//console.log({path, dflt, fn})
		this.state = this.state.updateIn(path, dflt, fn);
		return this;
	}

	_widgetById(prototype, id) {
		if (id >= 0) {
			const path = this._widgetPath(id);
			if (this._has(path))
				return new prototype(this, path, id);
		}
		return undefined;
	}

	_widgetPath(id, path) {
		if (_.isString(path)) return ['widgets', id.toString(), path];
		else if (_.isArray(path)) return ['widgets', id.toString()].concat(path);
		else return ['widgets', id.toString()];
	}

	_addWidget(w) {
		// Add widget to widgets list
		const id = this.widgetIdNext;
		this.state = this.state.setIn(['widgets', id.toString()], w);

		// Increment ID counter
		this.state = this.state.setIn(StatePaths.widgetIdNext, id + 1);

		return id;
	}

	_findWidgetDekstopIdById(widgetId) {
		//console.log(`_findWidgetDekstopIdById(${widgetId})`);
		//console.log(this.state);
		const w = this._getWidgetById(widgetId);
		if (w.get('type') === 'desktop') {
			return widgetId;
		}
		const parentId = w.get('parentId', -1);
		if (parentId >= 0) {
			return this._findWidgetDekstopIdById(parentId);
		}
		else {
			return -1;
		}
	}

	_getWidgetById(id) {
		return this.state.getIn(['widgets', id.toString()]);
	}

	/**
	 * Set the current screen.
	 * This will
	 * @param {(number|ScreenWrapper)} [screen] - the screen to set as current
	 */
	_setCurrent(screen) {
		if (_.isNumber(screen))
			screen = this.screenById(screen);
		else if (_.isUndefined(screen))
			screen = this.currentScreen;

		if (screen) {
			const desktop = screen.currentDesktop;
			/*
			if (!desktop) {
				this.print();
				console.log({screen})
			}
			*/
			// Update the widgetIdChain
			this._widgetIdChain
				.unshift(screen.id)
				.unshift(desktop.id);
			if (desktop.currentWindowId >= 0)
				this._widgetIdChain.unshift(desktop.currentWindowId);
			// Update the current pointers
			this
				._set(StatePaths.currentScreenId, screen.id)
				._set(StatePaths.currentDesktopId, desktop.id)
				._set(StatePaths.currentWindowId, desktop.currentWindowId);
		}
		return this;
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
