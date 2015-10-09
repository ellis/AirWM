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

class WidgetWrapper extends SubWrapper {
	constructor(top, path, id) {
		super(top, path, Map());
		this.id = id;
	}

	get type() { return this._get('type', 'window'); }
	get parentId() { return this._get('parentId', -1); }

	getRc() { return this._get('rc', List([0, 0, 0, 0])); }
	setRc(rc) {
		rc = List(rc).toJS();
		let rc1 = this.getRc();
		for (let i = 0; i < 4; i++) {
			rc1 = rc1.set(i, rc[i]);
		}
		this._set('rc', rc1);
	}

	set _parentId(id) { this._set('parentId', id); }
	//findDesktopId() { ... }
	//findScreenId() { ... }
}

class DesktopWrapper extends WidgetWrapper {
	constructor(top, path, id) {
		super(top, path, id);
		//console.log({top: this.top, path: this.path})
		assert.equal(this._get('type'), 'desktop');
	}

	get type() { return "desktop"; }
	get layout() { return this._get('type', 'default'); }
	get parentId() { return this._get('parentId', -1); }
	getChildIdOrder() { return this._get('childIdOrder', List()); }
	getChildIdChain() { return this._get('childIdChain', List()); }
	//getChildIdStack() { return this._get('childIdStack', List()); }
	get currentWindowId() { return this._get(['childIdChain', 0], -1); }

	findScreenId() { return this._get('parentId', -1); }
	findScreen() { return this.top.screenById(this.findScreenId()); }

	get _childIdOrder() { return new UniqueListWrapper(this.top, this.path.concat(['childIdOrder'])); }
	get _childIdChain() { return new UniqueListWrapper(this.top, this.path.concat(['childIdChain'])); }
	//_childIdStack() { return new UniqueListWrapper(this.top, this.path.concat(['childIdStack'])); }
}

class ListWrapper extends SubWrapper {
	constructor(top, path) {
		super(top, path, List());
	}

	get(i) { return this._get(i); }
	push(x) { this.top._update(this.path, List(), l => l.push(x)); return this; }
	unshift(x) { this.top._update(this.path, List(), l => l.push(x)); return this; }
	insert(x, index) { this.top._update(this.path, List(), l => l.push(x)); return this; }
	remove(x) { this.top._update(this.path, List(), l => listRemove(l, x)); return this; }
}

class ScreenWrapper extends WidgetWrapper {
	constructor(top, path, id) {
		super(top, path, id);
		assert.equal(this._get('type'), 'screen');
	}

	get xid() { return this._get('xid', -1); }
	get width() { return this._get('width', 0); }
	get height() { return this._get('height', 0); }
	get backgroundId() { return this._get('backgroundId', -1); }

	get currentDesktopId() { return this._get(['desktopIdChain', 0], -1); }
	get currentDesktop() { return this.top.desktopById(this.currentDesktopId); }

	getDesktopIdChain() { return this._get('desktopIdChain', List()); }
	getDockIdOrder() { return this._get('dockIdOrder', List()); }

	get _desktopIdChain() { return new UniqueListWrapper(this.top, this.path.concat(['desktopIdChain'])); }
	get _dockIdOrder() { return new UniqueListWrapper(this.top, this.path.concat(['dockIdOrder'])); }
	set _backgroundId(id) { this._set('backgroundId', id); }
}

class UniqueListWrapper extends SubWrapper {
	constructor(top, path) {
		super(top, path, List());
	}

	get(i) { return this._get(i); }
	push(x) { this.top._update(this.path, List(), l => listRemove(l, x).push(x)); return this; }
	unshift(x) { this.top._update(this.path, List(), l => listRemove(l, x).unshift(x)); return this; }
	insert(x, index) { this.top._update(this.path, List(), l => listRemove(l, x).splice(index, 0, x)); return this; }
	remove(x) { this.top._update(this.path, List(), l => listRemove(l, x)); return this; }
}

class WindowWrapper extends WidgetWrapper {
	constructor(top, path, id) {
		super(top, path, id);
		//console.log({top: this.top, path: this.path})
		assert(['window', 'dock', 'background'].indexOf(this._get('type')) >= 0, "invalid window type:" +this._get('type'));
	}

	get type() { return this._get('type', 'window'); }
	get visible() { return this._get('visible', false); }
	set visible(visible) { return this._set('visible', (visible) ? true : false); }
	get xid() { return this._get('xid'); }

	findDesktopId() { return this.top._findWidgetDekstopIdById(this.id); }
	findDesktop() { return this.top.desktopById(this.findDesktopId()); }
	findScreenId() { return this.top._findWidgetScreenIdById(this.id); }
	findScreen() { return this.top.screenById(this.findScreenId()); }
}

export const StatePaths = {
	widgetIdNext: ['widgetIdNext'],
	screenIdOrder: ['screenIdOrder'],
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
	windowById(windowId) { return this._widgetById(WindowWrapper, windowId); }

	get currentScreen() { return this.screenById(this.currentScreenId); }
	get currentDesktop() { return this.desktopById(this.currentDesktopId); }
	get currentWindow() { return this.windowById(this.currentWindowId); }

	findScreenIdByNum(num) { return this._get(StatePaths.screenIdOrder.concat(num), -1); }
	findDesktopIdByNum(num) { return this._get(StatePaths.desktopIdOrder.concat(num), -1); }

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
	unparentWindow(window) {
		if (_.isNumber(window))
			window = this.windowById(window);
		if (window) {
			//console.log({window})
			const parentId = window.parentId;

			if (parentId >= 0) {
				// Find window's desktop
				const desktopId = this._findWidgetDekstopIdById(window.id);

				// Set window's parent to -1
				window._parentId = -1;

				// If the window is assigned to a screen
				//console.log({parentType: this._get(['widgets', parentId.toString(), 'type'])})
				if (this._get(['widgets', parentId.toString(), 'type']) === 'screen') {
					const screen = this.screenById(parentId);
					screen._dockIdOrder.remove(window.id);
					//console.log({screenBackgroundId: screen.backgroundId, windowId: window.id})
					if (screen.backgroundId === window.id)
						screen._backgroundId = -1;
				}
				// Otherwise look for desktop parent
				else {
					// Remove window from desktop's window chain
					if (desktopId >= 0) {
						const desktop = this.desktopById(desktopId);
						desktop._childIdOrder.remove(window.id);
						desktop._childIdChain.remove(window.id);
						//desktop._childIdStack.remove(windowId);
					}
				}

				this._setCurrent();
			}
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
				// Swap desktop on this screen to that screen
				desktopPrev._set('parentId', screenPrev.id);
				screenPrev._desktopIdChain.unshift(desktopPrev.id);
			}
			// Otherwise unparent the previous desktop
			else {
				desktopPrev._set('parentId', -1);
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

	moveWindowToDesktop(window, desktop) {
		if (_.isUndefined(window))
			window = this.currentWindow;
		else if (_.isNumber(window))
			window = this.windowById(window);
		if (_.isNumber(desktop))
			desktop = this.desktopById(desktop);

		const desktopId0 = this._findWidgetDekstopIdById(window.id);
		// Add window to given desktop
		if (desktop && desktop.id !== desktopId0) {
			// Remove window from old parent
			this.unparentWindow(window);
			// Set parent ID
			window._parentId = desktop.id;
			//console.log({desktopId, desktop})
			//console.log(desktop._childIdOrder)
			// Append to desktop's child list
			desktop._childIdOrder.push(window.id);
			desktop._childIdChain.push(window.id);
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

	moveWindowToScreen(window, screen) {
		if (_.isUndefined(window))
			window = this.currentWindow;
		else if (_.isNumber(window))
			window = this.windowById(window);
		if (_.isUndefined(screen))
			screen = this.currentScreen;
		else if (_.isNumber(screen))
			screen = this.screenById(screen);

		// Add window to given screen
		if (screen && window && window.parentId !== screen.id) {
			switch (window.type) {
				case 'window': {
					const desktopId = screen.currentDesktopId;
					this.moveWindowToDesktop(window.id, desktopId);
					break;
				}
				case 'dock':
				case 'background': {
					// Remove window from old parent
					this.unparentWindow(window);
					// Set parent ID
					window._parentId = screen.id;
					if (window.type === 'dock')
						screen._dockIdOrder.push(window.id);
					else
						screen._backgroundId = window.id;
					this._setCurrent();
					//console.log({window})
					break;
				}
			}
		}
		return this;
	}

	moveWindowToIndexNext(window) {
		return this._moveWindowToIndexDir(window, true);
	}

	moveWindowToIndexPrev(window) {
		return this._moveWindowToIndexDir(window, false);
	}

	activateScreen(screen) {
		this._setCurrent(screen);
		return this;
	}

	activateDesktop(desktop) {
		//console.log('activateDesktop')
		//console.log(desktop)
		if (_.isNumber(desktop))
			desktop = this.desktopById(desktop);
		if (desktop) {
			//console.log(desktop)
			// If the desktop is already on a screen, activate that screen
			let screenId = desktop.findScreenId();
			//console.log({screenId})
			if (screenId >= 0) {
				this._setCurrent(screenId);
			}
			// Otherwise, move the desktop to the current screen.
			else {
				//console.log(1)
				this.moveDesktopToScreen(desktop, this.currentScreen);
			}
		}
		return this;
	}

	activateWindow(windowId) {
		// Find desktop
		const desktop = this.desktopById(this._findWidgetDekstopIdById(windowId));
		if (desktop) {
			// Move window to front on desktop's chain
			desktop._childIdChain.unshift(windowId);
			// And activate the desktop
			this.activateDesktop(desktop);
		}
		//
		// Activate desktop
		return this;
	}

	activateWindowNext(window) {
		return this._activateWindowDir(window, true);
	}

	activateWindowPrev(window) {
		return this._activateWindowDir(window, false);
	}

	removeWindow(windowId) {
		if (_.isUndefined(windowId))
			windowId = this.currentWindowId;

		//console.log({windowId, state: this.state})
		this.unparentWindow(windowId);
		this._windowIdOrder.remove(windowId);
		this._windowIdStack.remove(windowId);
		this._widgetIdChain.remove(windowId);
		this.state = this.state.deleteIn(['widgets', windowId.toString()]);
		this._setCurrent();
		//console.log({windowId, state: this.state})
		return this;
	}

	forEachScreen(fn) {
		//this.print();
		this.getScreenIdOrder().forEach(screenId => {
			const screen = this.screenById(screenId);
			fn(screen);
		});
		return this;
	}

	mapEachScreen(fn) {
		const result = [];
		this.getScreenIdOrder().forEach(id => {
			const screen = this.screenById(id);
			result.push(fn(screen));
		});
		return result;
	}

	forEachDesktop(fn) {
		this.getDesktopIdOrder().forEach(id => {
			const desktop = this.desktopById(id);
			fn(desktop);
		});
		return this;
	}

	forEachWindow(fn) {
		this.getWindowIdOrder().forEach(id => {
			const window = this.windowById(id);
			fn(window);
		});
		return this;
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

	_update(path, dflt, fn) {
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

	_activateWindowDir(window, next) {
		const result = this._calcWindowIndexDir(window, next);
		if (result) {
			const windowId = result.desktop._childIdOrder.get(result.indexNew);
			result.desktop._childIdChain.unshift(windowId);
			this._setCurrent();
		}
	}

	_addWidget(w) {
		// Add widget to widgets list
		const id = this.widgetIdNext;
		this.state = this.state.setIn(['widgets', id.toString()], w);

		// Increment ID counter
		this.state = this.state.setIn(StatePaths.widgetIdNext, id + 1);

		return id;
	}

	_calcWindowIndexDir(window, next) {
		if (_.isUndefined(window))
			window = this.currentWindow;
		else if (_.isNumber(window))
			window = this.windowById(window);
		if (window) {
			const desktopId = this._findWidgetDekstopIdById(window.id);
			const desktop = this.desktopById(desktopId);
			if (desktop) {
				const l = desktop.getChildIdOrder();
				const i = l.indexOf(window.id);
				const j = (next)
					? (i + 1) % l.count()
					: (i == 0) ? l.count() - 1 : i - 1;
				return {window, desktop, indexNew: j}
			}
		}
		return undefined;
	}

	_findWidgetScreenIdById(widgetId) {
		//console.log(`_findWidgetDekstopIdById(${widgetId})`);
		//console.log(this.state);
		const w = this._getWidgetById(widgetId);
		if (w.get('type') === 'screen') {
			return widgetId;
		}
		const parentId = w.get('parentId', -1);
		if (parentId >= 0) {
			return this._findWidgetScreenIdById(parentId);
		}
		else {
			return -1;
		}
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

	_moveWindowToIndexDir(window, next) {
		const result = this._calcWindowIndexDir(window, next);
		if (result) {
			result.desktop._childIdOrder.insert(result.window.id, result.indexNew);
			this._setCurrent();
		}
		return this;
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
};
