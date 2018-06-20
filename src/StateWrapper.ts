// tslint:disable:max-classes-per-file
// tslint:disable:variable-name

import assert from "lazy-ass";
import _ from "lodash";
import { set } from "monolite";
// import {List, Map, fromJS} from 'immutable';

export interface State {
	readonly widgetIdNext: number;
	readonly screenIdOrder: ReadonlyArray<number>;
	readonly desktopIdOrder: ReadonlyArray<number>;
	readonly windowIdOrder: ReadonlyArray<number>;
	readonly windowIdStack: ReadonlyArray<number>;
	readonly windowIdDetached: ReadonlyArray<number>;
	readonly widgetIdChain: ReadonlyArray<number>;
	readonly currentScreenId: number;
	readonly currentDesktopId: number;
	readonly currentWindowId: number;
	readonly widgets: { readonly [id: string]: Widget };
	readonly x11: {
		screens: {
			readonly [screenId: string]: {
				colors: { readonly [key: string]: any };
			};
		};
	};
}

export const initialState: State = {
	widgetIdNext: 0,
	screenIdOrder: [],
	desktopIdOrder: [],
	windowIdOrder: [],
	windowIdStack: [],
	windowIdDetached: [],
	widgetIdChain: [],
	currentScreenId: -1,
	currentDesktopId: -1,
	currentWindowId: -1,
	widgets: {},
	x11: {
		screens: {},
	},
};

function listRemove<T>(l: ReadonlyArray<T> | undefined, x: T): ReadonlyArray<T> {
	return (l || []).filter(a => a !== x);
}

export type WrapperPath = ReadonlyArray<string | number>;

export class SubWrapper<T> {
	protected top: StateWrapper; // root
	protected path: WrapperPath;
	private dflt: T | undefined;

	constructor(top: any, path: WrapperPath, dflt?: T) {
		this.top = top;
		this.path = path;
		this.dflt = dflt;
	}

	public getState(x?: any): T {
		return this.top._get(this.path, this.dflt);
	}

	public set(newData: T): SubWrapper<T> {
		this.top._set(this.path, newData);
		return this;
	}

	public get data(): T {
		return this.top._get(this.path, this.dflt);
	}

	public _data(): T {
		return this.top._get(this.path, this.dflt);
	}

	public _get(path: WrapperPath, dflt?: any): any {
		return this.top._get(this.path.concat(path), dflt);
	}

	public _set(path: WrapperPath, value: any) {
		return this.top._set(this.path.concat(path), value);
	}

	public _update<V>(path: WrapperPath, dflt: V, fn: (value0: V | undefined) => V) {
		return this.top._update(this.path.concat(path), dflt, fn);
	}
}

export type Rect = [number, number, number, number];

export enum WidgetType {
	window = "window",
	desktop = "desktop",
	screen = "screen",
	dock = "dock",
	background = "background",
}

export interface Widget {
	type: WidgetType;
	parentId: number;
	/** x, y, w, h */
	rc: Rect;
}

const DEFAULT_WIDGET: Widget = { type: WidgetType.window, parentId: -1, rc: [0, 0, 0, 0] };

class WidgetWrapper<W extends Widget> extends SubWrapper<W> {
	public id: number;

	constructor(top: any, path: WrapperPath, id: number, dflt: W) {
		super(top, path);
		this.id = id;
	}

	get type() {
		return this.data.type;
	}
	get parentId() {
		return this.data.parentId;
	}

	public getRc() {
		return this.data.rc;
	}
	public setRc(rc: Rect) {
		this.set(set(this.data, x => x.rc)(rc));
	}

	set _parentId(id: number) {
		this.set(set(this.data, x => x.parentId)(id));
	}
}

enum DesktopLayout {
	default = "default",
}

export interface Desktop extends Widget {
	layout: DesktopLayout;
	childIdOrder: ReadonlyArray<number>;
	childIdChain: ReadonlyArray<number>;
}

const DEFAULT_DESKTOP: Desktop = {
	...DEFAULT_WIDGET,
	layout: DesktopLayout.default,
	childIdOrder: [],
	childIdChain: [],
};

class DesktopWrapper extends WidgetWrapper<Desktop> {
	constructor(top: any, path: WrapperPath, id: number) {
		super(top, path, id, DEFAULT_DESKTOP);
		// console.log({top: this.top, path: this.path})
		assert(this._get(["type"]) === "desktop");
	}

	get layout() {
		return this._get(["type"], "default");
	}
	public getChildIdOrder() {
		return this._data().childIdOrder;
	}
	public getChildIdChain() {
		return this._data().childIdChain;
	}
	get currentWindowId() {
		return this._get(["childIdChain", 0], -1);
	}

	public findScreenId() {
		return this._data().parentId;
	}
	public findScreen() {
		return this.top.screenById(this.findScreenId());
	}

	public get _childIdOrder(): UniqueListWrapper<number> {
		return new UniqueListWrapper(this.top, this.path.concat(["childIdOrder"]));
	}
	public get _childIdChain(): UniqueListWrapper<number> {
		return new UniqueListWrapper(this.top, this.path.concat(["childIdChain"]));
	}
	// _childIdStack() { return new UniqueListWrapper(this.top, this.path.concat(['childIdStack'])); }
}

class ListWrapper<T> extends SubWrapper<ReadonlyArray<T>> {
	constructor(top: SubWrapper<any>, path: WrapperPath) {
		super(top, path, []);
	}

	public get(i: number): T | undefined {
		return this._get([i]);
	}
	public push(x: T) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l => (l || []).concat([x]));
		return this;
	}
	public unshift(x: T) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l => (l || []).concat([x]));
		return this;
	}
	public insert(x: T, index: number) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l => (l || []).concat([x]));
		return this;
	}
	public remove(x: T) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l => listRemove(l, x));
		return this;
	}
}

export interface Screen extends Widget {
	/** X's ID for this screen.  @default -1 */
	readonly xid: number;
	/** Screen width.  @default 0 */
	readonly width: number;
	/** Screen height.  @default 0 */
	readonly height: number;
	/** @default -1 */
	readonly backgroundId: number;
	readonly desktopIdChain: ReadonlyArray<number>;
	readonly dockIdOrder: ReadonlyArray<number>;
}

export const DEFAULT_SCREEN: Screen = {
	...DEFAULT_WIDGET,
	type: WidgetType.screen,
	xid: -1,
	width: 0,
	height: 0,
	backgroundId: -1,
	desktopIdChain: [],
	dockIdOrder: [],
};

class ScreenWrapper extends WidgetWrapper<Screen> {
	constructor(top: StateWrapper, path: WrapperPath, id: number) {
		super(top, path, id, DEFAULT_SCREEN);
		assert(this._get(["type"]) === "screen");
	}

	get xid() {
		return this._data().xid;
	}
	get width() {
		return this._data().width;
	}
	get height() {
		return this._data().height;
	}
	get backgroundId() {
		return this._data().backgroundId;
	}

	get currentDesktopId() {
		return this._get(["desktopIdChain", 0], -1);
	}
	get currentDesktop() {
		return this.top.desktopById(this.currentDesktopId());
	}

	public getDesktopIdChain() {
		return this._data().desktopIdChain;
	}
	public getDockIdOrder() {
		return this._data().dockIdOrder;
	}

	get _desktopIdChain() {
		return new UniqueListWrapper(this.top, this.path.concat(["desktopIdChain"]));
	}
	get _dockIdOrder() {
		return new UniqueListWrapper(this.top, this.path.concat(["dockIdOrder"]));
	}
	set _backgroundId(id: number) {
		this._set(["backgroundId"], id);
	}
}

export class UniqueListWrapper<T> extends SubWrapper<ReadonlyArray<T>> {
	constructor(top: StateWrapper, path: WrapperPath) {
		super(top, path, []);
	}

	public count() {
		return this._get([], []).count();
	}
	public get(i: number) {
		return this._get([i]);
	}
	public push(x: T) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l => listRemove(l, x).concat([x]));
		return this;
	}
	public unshift(x: T) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l => [x, ...listRemove(l, x)]);
		return this;
	}
	public insert(x: T, index: number) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l =>
			[...listRemove(l, x)].splice(index, 0, x)
		);
		return this;
	}
	public remove(x: T) {
		this.top._update<ReadonlyArray<T>>(this.path, [], l => listRemove(l, x));
		return this;
	}
}

export interface Window extends Widget {
	readonly visible: boolean;
	readonly xid: number;
	readonly transientForId: number;
	readonly flags: {
		askBeforeClosing: boolean;
		closing: boolean;
		detaching: boolean;
		floating: boolean;
		modal: boolean;
		requestClose: boolean;
	};
	readonly state: {};
	/** The attributes which we've requested be set */
	readonly requested: { readonly [key: string]: any };
}

const DEFAULT_WINDOW: Window = {
	...DEFAULT_WIDGET,
	type: WidgetType.window,
	visible: true,
	xid: -1,
	transientForId: -1,
	flags: {
		askBeforeClosing: false,
		closing: false,
		detaching: false,
		floating: false,
		modal: false,
		requestClose: false,
	},
	state: {},
	requested: {},
};

export class WindowWrapper extends WidgetWrapper<Window> {
	constructor(top: StateWrapper, path: WrapperPath, id: number) {
		super(top, path, id, DEFAULT_WINDOW);
		// console.log({top: this.top, path: this.path})
		assert(
			["window", "dock", "background"].indexOf(this._data().type) >= 0,
			"invalid window type:" + this._data().type
		);
	}

	get type() {
		return this._data().type;
	}
	get visible() {
		return this._data().visible;
	}
	set visible(visible: boolean) {
		this._set(["visible"], visible);
	}
	get xid() {
		return this._data().xid;
	}
	get transientForId() {
		return this._data().transientForId;
	}
	get flagFloating() {
		return this._get(["flags", "floating"], false);
	}
	set flagFloating(x: boolean) {
		const path = ["flags", "floating"];
		this._set(path, true);
	}
	get flagModal() {
		return this._get(["flags", "modal"], false);
	}
	set flagModal(x) {
		const path = ["flags", "modal"];
		this._set(path, true);
	}

	public getRequestedSize() {
		return this._get(["requested", "size"]);
	}
	public getRequestedPos() {
		return this._get(["requested", "pos"]);
	}
	public getModalIdOrder() {
		return this._get(["modalIdOrder"], []);
	}

	public findDesktopId(): number {
		return this.top._findWidgetDekstopIdById(this.id);
	}
	public findDesktop() {
		return this.top.desktopById(this.findDesktopId());
	}
	public findScreenId() {
		return this.top._findWidgetScreenIdById(this.id);
	}
	public findScreen() {
		return this.top.screenById(this.findScreenId());
	}

	get _modalIdOrder() {
		return new UniqueListWrapper(this.top, this.path.concat(["modalIdOrder"]));
	}
}

export const StatePaths = {
	widgetIdNext: ["widgetIdNext"] as WrapperPath,
	screenIdOrder: ["screenIdOrder"] as WrapperPath,
	desktopIdOrder: ["desktopIdOrder"] as WrapperPath,
	windowIdOrder: ["windowIdOrder"] as WrapperPath,
	windowIdStack: ["windowIdStack"] as WrapperPath,
	windowIdDetached: ["windowIdDetached"] as WrapperPath,
	widgetIdChain: ["widgetIdChain"] as WrapperPath,
	currentScreenId: ["currentScreenId"] as WrapperPath,
	currentDesktopId: ["currentDesktopId"] as WrapperPath,
	currentWindowId: ["currentWindowId"] as WrapperPath,
};

export type WhichWindow = WindowWrapper | number | undefined;
export type WhichDesktop = DesktopWrapper | number | undefined;
export type WhichScreen = ScreenWrapper | number | undefined;

export default class StateWrapper {
	public state: State;
	private _screenIdOrder: UniqueListWrapper<number>;
	private _desktopIdOrder: UniqueListWrapper<number>;
	private _windowIdOrder: UniqueListWrapper<number>;
	private _windowIdStack: UniqueListWrapper<number>;
	private _windowIdDetached: UniqueListWrapper<number>;
	private _widgetIdChain: UniqueListWrapper<number>;

	constructor(state: State) {
		this.state = state;

		this._screenIdOrder = new UniqueListWrapper(this, StatePaths.screenIdOrder);
		this._desktopIdOrder = new UniqueListWrapper(this, StatePaths.desktopIdOrder);
		this._windowIdOrder = new UniqueListWrapper(this, StatePaths.windowIdOrder);
		this._windowIdStack = new UniqueListWrapper(this, StatePaths.windowIdStack);
		this._windowIdDetached = new UniqueListWrapper(this, StatePaths.windowIdDetached);
		this._widgetIdChain = new UniqueListWrapper(this, StatePaths.widgetIdChain);
	}

	public clone() {
		return new StateWrapper(this.state);
	}

	public print(path: WrapperPath = []) {
		const x = _.get(this.state, [...path]);
		console.log(JSON.stringify(x, null, "\t"));
	}

	public getState() {
		return this.state;
	}
	public getScreenIdOrder() {
		return this.state.screenIdOrder;
	}
	public getDesktopIdOrder() {
		return this.state.desktopIdOrder;
	}
	public getWindowIdOrder() {
		return this.state.windowIdOrder;
	}
	public getWindowIdStack() {
		return this.state.windowIdStack;
	}
	public getWindowIdDetached() {
		return this.state.windowIdDetached;
	}
	public getWidgetIdChain() {
		return this.state.widgetIdChain;
	}
	get widgetIdNext() {
		return this.state.widgetIdNext;
	}
	get currentScreenId() {
		return this.state.currentScreenId;
	}
	get currentDesktopId() {
		return this.state.currentDesktopId;
	}
	get currentWindowId() {
		return this.state.currentWindowId;
	}

	public screenById(screenId: number): ScreenWrapper {
		if (screenId >= 0) {
			const w = this.state.widgets[screenId.toString()];
			if (w) {
				const path = this._widgetPath(screenId);
				return new ScreenWrapper(this, path, screenId);
			}
		}
		throw new Error("Screen missing in widget set: " + screenId);
	}
	public desktopById(desktopId: number): DesktopWrapper {
		if (desktopId >= 0) {
			const w = this.state.widgets[desktopId.toString()];
			if (w) {
				const path = this._widgetPath(desktopId);
				return new DesktopWrapper(this, path, desktopId);
			}
		}
		throw new Error("Desktop missing in widget set: " + desktopId);
	}
	public windowById(windowId: number): WindowWrapper | undefined {
		if (windowId >= 0) {
			const w = this.state.widgets[windowId.toString()];
			if (w) {
				const path = this._widgetPath(windowId);
				return new WindowWrapper(this, path, windowId);
			}
		}
		throw new Error("Window missing in widget set: " + windowId);
	}

	get currentScreen(): ScreenWrapper {
		return this.screenById(this.currentScreenId);
	}
	get currentDesktop(): DesktopWrapper {
		return this.desktopById(this.currentDesktopId);
	}
	get currentWindow(): WindowWrapper | undefined {
		return this.windowById(this.currentWindowId);
	}

	public findScreenIdByNum(num: number): number {
		return this._get(StatePaths.screenIdOrder.concat([num]), -1);
	}
	public findDesktopIdByNum(num: number): number {
		return this._get(StatePaths.desktopIdOrder.concat([num]), -1);
	}

	public findWindowIdOnDesktopByNum(
		desktop: DesktopWrapper | number,
		num: number
	): number | undefined {
		const desktop1: DesktopWrapper | undefined = _.isUndefined(desktop)
			? this.currentDesktop
			: _.isNumber(desktop)
				? this.desktopById(desktop)
				: desktop;

		if (desktop1) {
			const l = desktop1.getChildIdOrder();
			return l[num];
		}
		return undefined;
	}

	public findWindowNum(
		whichWindow: WhichWindow,
		whichDesktop: WhichDesktop,
		offset: number
	):
		| { readonly window: WindowWrapper; readonly desktop: DesktopWrapper; readonly num: number }
		| undefined {
		const window = this.getWhichWindow(whichWindow);
		if (window) {
			const desktop = this.getWhichDesktop(whichDesktop);
			if (desktop) {
				const l = desktop.getChildIdOrder();
				const num = l.indexOf(window.id);
				let num2 = _.isNumber(offset) ? num + offset : num;
				num2 = num2 % l.length;
				if (num2 < 0) {
					num2 = l.length + num2;
				}
				return { window, desktop, num: num2 };
			}
		}
		return undefined;
	}

	public check() {
		assert(this.widgetIdNext >= 0, "`widgetIdNext` must be >= 0");

		// Each screen has a desktop, and that desktop references the screen
		this.forEachScreen(screen => {
			const desktop = screen.currentDesktop;
			if (desktop) {
				assert(desktop.parentId === screen.id);
			}
		});

		// Desktops and their children
		this.forEachDesktop(desktop => {
			const childIdOrder = desktop.getChildIdOrder();
			const childIdChain = desktop.getChildIdChain();
			// childIdStack is a permutation of childIdOrder
			assert(
				_.difference(childIdOrder, childIdChain).length === 0,
				`should be permutations: childIdOrder=${childIdOrder} and childIdChain=${childIdChain}`
			);
			// Each child references this desktop
			childIdOrder.forEach(childId => {
				const w = this.state.widgets[childId.toString()];
				assert(
					w,
					"desktop with id=" +
						desktop.id +
						" reference non-existent child with id " +
						childId
				);
				assert(w.parentId === desktop.id);
			});
		});

		/*this.state.get('widgetIdChain').forEach(id => {
			assert(this.state.hasIn(['widgets', id.toString()]), "widgetIdChain contain an ID that isn't in the widgets list: "+id);
		});*/
		this.state.windowIdOrder.forEach(id => {
			assert(
				this.state.widgets[id.toString()],
				"widgetIdOrder contain an ID that isn't in the widgets list: " + id
			);
		});

		// Check that current focus widgets are at the top of the relevant stacks
		/*if (true) {
			const screenId = currentScreenId;
			const desktopId = currentDesktopId;
			const windowId = currentWindowId;
		}*/
	}

	public addDesktop(w: Partial<Desktop>) {
		// Default values
		const w1: Desktop = {
			...DEFAULT_DESKTOP,
			...w,
			type: WidgetType.desktop,
		};

		// Add widget to widgets list
		const id = this._addWidget(w1);

		// Append to desktop list
		this._desktopIdOrder.push(id);
		this._widgetIdChain.push(id);

		// Append to the visit list for all screens
		this.forEachScreen(screen => {
			screen._desktopIdChain.push(id);
		});

		return id;
	}

	public addScreen(screen: Partial<Screen>) {
		const desktopIdOrder0 = this.getDesktopIdOrder();
		// List of exisitng desktop which are on a screen
		const desktopIdVisibles = this.mapEachScreen(screen2 => screen2.currentDesktopId);
		// List of exisitng desktop which aren't currently shown on any screen
		const desktopIdHiddens = _.difference(desktopIdOrder0, desktopIdVisibles);

		// Figure out which desktop to display
		const desktopId =
			// If there aren't and free desktops to display on this screen:
			_.isEmpty(desktopIdHiddens)
				? // Create a new desktop for this screen.
				  this.addDesktop({})
				: // Otherwise, take the first hidden desktop
				  _.first(desktopIdHiddens);

		// Chaining order for desktops, puts chosen desktop at front of list of all desktops
		const desktopIdChain = [desktopId].concat(_.without(desktopIdOrder0, desktopId));

		const w: Screen = {
			...DEFAULT_SCREEN,
			...screen,
			type: WidgetType.screen,
			desktopIdChain,
		};

		// Add widget to widgets list
		const id = this._addWidget(w);

		// Append to screen lists
		this._screenIdOrder.push(id);
		this._widgetIdChain.push(id);

		// Set desktop's parentId
		// console.log({desktopId, desktop: this.desktopById(desktopId), id, klass: typeof this.desktopById(desktopId)})
		const desktop = this.desktopById(desktopId);
		desktop.set(set(desktop.data, x => x.parentId)(id));

		// If this is the first screen, set it as current:
		if (this.currentScreenId < 0) {
			this._setCurrent(id);
		}

		return id;
	}

	/**
	 * Add a window to the state.
	 * It won't have a parent and will be put at the end of the window lists.
	 * @param {object} w - object describing a window
	 * @param {number} w.xid - the X11 window ID
	 * @returns ID of new window
	 */
	public addWindow(window: Partial<Window>) {
		const w: Window = {
			...DEFAULT_WINDOW,
			...window,
			type: WidgetType.window,
			parentId: -1,
			state: {},
		};

		// Add widget to widgets list
		const id = this._addWidget(w);
		// console.log(w);
		assert(id >= 0, "addWidget() returned -1: " + JSON.stringify(w));

		// Append to window lists
		this._windowIdOrder.push(id);
		this._windowIdStack.push(id);
		this._widgetIdChain.push(id);

		return id;
	}

	public attachWindow(spec: Partial<Window>): number | undefined {
		const id = this.addWindow(spec);
		const w = this.windowById(id);
		if (w) {
			const transientForId = w.transientForId;
			if (transientForId >= 0) {
				const ref = this.windowById(transientForId);
				if (ref) {
					// Add to transient list of parent window
					if (w.flagModal) {
						ref._update<ReadonlyArray<number>>(["modalIdOrder"], [], l =>
							(l || []).concat([id])
						);
					}
					// If not otherwise specified, request x/y to center the dialog on it's parent
					const requested = w._get(["requested", "pos"], [0, 0]);
					const size = w._get(["requested", "size"]);
					if (size && !(requested.x > 0 || requested.y > 0)) {
						const rc = ref.getRc();
						const x = rc[0] + (rc[2] - size.get(0)) / 2;
						const y = rc[1] + (rc[3] - size.get(1)) / 2;
						w._set(["requested", "pos"], [x, y]);
					}
					// Specify desktop and focus
					const desktop = ref.findDesktop();
					if (desktop) {
						// Put the window on the ref's desktop
						this.moveWindowToDesktop(w, desktop);
						// Put it right after the ref
						const found = this.findWindowNum(ref, desktop, 1);
						if (found) {
							const { num } = found;
							this.moveWindowToIndex(w, num);
							// Focus it, if the reference has focus
							if (desktop.getChildIdChain()[0] === ref.id) {
								desktop._childIdChain.unshift(id);
							}
							this._setCurrent();
							return id;
						}
					}
				}
			}
			this.moveWindowToScreen(w, undefined);
			return id;
		}
		return undefined;
	}

	public detachWindow(which: WindowWrapper | number) {
		const window = this.getWhichWindow(which);
		if (window) {
			this.unparentWindow(window);
			window._set(["flags", "detaching"], true);
			const id = window.id;
			this._windowIdOrder.remove(id);
			this._windowIdStack.remove(id);
			this._windowIdDetached.push(id);
			this._widgetIdChain.remove(id);

			// Also remove from modalIdOrder of reference window
			const transientForId = window.transientForId;
			if (transientForId >= 0) {
				const ref = this.windowById(transientForId);
				if (ref) {
					ref._modalIdOrder.remove(id);
				}
			}
		}

		return this;
	}

	public closeWindow(which?: WhichWindow) {
		const window = this.getWhichWindow(which);
		if (window) {
			if (window._data().flags.askBeforeClosing) {
				window._set(["flags", "requestClose"], true);
			} else {
				this.detachWindow(window);
				window._set(["flags", "detaching"], false);
				window._set(["flags", "closing"], true);
			}
		}

		return this;
	}

	/**
	 * Remove window from desktop.  Window will not be visible.
	 *
	 * @param  {number} windowId
	 */
	public unparentWindow(which?: WhichWindow) {
		const window = this.getWhichWindow(which);
		if (window) {
			// console.log({window})
			const parentId = window.parentId;

			if (parentId >= 0) {
				// Find window's desktop
				const desktopId = this._findWidgetDekstopIdById(window.id);

				// Set window's parent to -1
				window._parentId = -1;

				// If the window is assigned to a screen
				// console.log({parentType: this._get(['widgets', parentId.toString(), 'type'])})
				const parent = this.state.widgets[parentId.toString()];
				if (parent && parent.type === "screen") {
					const screen = this.screenById(parentId);
					screen._dockIdOrder.remove(window.id);
					// console.log({screenBackgroundId: screen.backgroundId, windowId: window.id})
					if (screen.backgroundId === window.id) {
						screen._backgroundId = -1;
					}
				}
				// Otherwise look for desktop parent
				else if (!_.isUndefined(desktopId) && desktopId >= 0) {
					// Remove window from desktop's window chain
					const desktop = this.desktopById(desktopId);
					if (desktop) {
						desktop._childIdOrder.remove(window.id);
						desktop._childIdChain.remove(window.id);
						// desktop._childIdStack.remove(windowId);
					}
				}

				this._setCurrent();
			}
		}

		return this;
	}

	public moveDesktopToScreen(
		whichDesktop: DesktopWrapper | number | undefined,
		whichScreen: ScreenWrapper | number
	) {
		const desktop = this.getWhichDesktop(whichDesktop);
		const screen = this.getWhichScreen(whichScreen);

		if (desktop && screen) {
			const screenPrev = this.screenById(desktop.findScreenId());
			const desktopPrev = this.desktopById(screen.currentDesktopId);
			// If the desktop was already displayed on another screen
			if (screenPrev && screenPrev.id !== screen.id) {
				// Swap desktop on this screen to that screen
				desktopPrev._parentId = screenPrev.id;
				screenPrev._desktopIdChain.unshift(desktopPrev.id);
			}
			// Otherwise unparent the previous desktop
			else {
				desktopPrev._parentId = -1;
			}
			// Place desktop on screen
			desktop._parentId = screen.id;
			// Move desktop to head of screen's stack
			screen._desktopIdChain.unshift(desktop.id);
			// Update current pointers
			this._setCurrent();
		}
		return this;
	}

	public moveWindowToDesktop(whichWindow: WhichWindow, whichDesktop: DesktopWrapper | number) {
		const window = this.getWhichWindow(whichWindow);

		const desktop = this.getWhichDesktop(whichDesktop);

		if (window) {
			const desktopId0 = this._findWidgetDekstopIdById(window.id);
			// Add window to given desktop
			if (desktop && desktop.id !== desktopId0) {
				// Remove window from old parent
				this.unparentWindow(window);
				// Set parent ID
				window._parentId = desktop.id;
				// console.log({desktopId, desktop})
				// console.log(desktop._childIdOrder)
				// Append to desktop's child list
				desktop._childIdOrder.push(window.id);
				desktop._childIdChain.push(window.id);
				// desktop._childIdStack.push(windowId);
				// console.log(1)
				// this.print()
				this._setCurrent();
				// console.log(2)
				// console.log(this.currentWindowId);
				// this.print()
			}
		}
		return this;
	}

	public moveWindowToScreen(
		whichWindow: WhichWindow,
		whichScreen: ScreenWrapper | number | undefined
	) {
		const window = this.getWhichWindow(whichWindow);
		const screen = this.getWhichScreen(whichScreen);

		// Add window to given screen
		if (screen && window && window.parentId !== screen.id) {
			switch (window.type) {
				case "window": {
					const desktopId = screen.currentDesktopId;
					this.moveWindowToDesktop(window.id, desktopId);
					break;
				}
				case "dock":
				case "background": {
					// Remove window from old parent
					this.unparentWindow(window);
					// Set parent ID
					window._parentId = screen.id;
					if (window.type === "dock") {
						screen._dockIdOrder.push(window.id);
					} else {
						screen._backgroundId = window.id;
					}
					this._setCurrent();
					// console.log({window})
					break;
				}
			}
		}
		return this;
	}

	public moveWindowToIndex(which: WhichWindow, index: number) {
		const window = this.getWhichWindow(which);
		if (window) {
			const desktop = window.findDesktop();
			if (desktop) {
				desktop._childIdOrder.insert(window.id, index);
				this._setCurrent();
			}
		}
	}

	public moveWindowToIndexNext(window?: WhichWindow) {
		return this._moveWindowToIndexDir(window, true);
	}

	public moveWindowToIndexPrev(window?: WhichWindow) {
		return this._moveWindowToIndexDir(window, false);
	}

	public activateScreen(screen: WhichScreen) {
		this._setCurrent(screen);
		return this;
	}

	public activateDesktop(which: WhichDesktop) {
		const desktop = this.getWhichDesktop(which);
		// console.log('activateDesktop')
		// console.log(desktop)
		if (desktop) {
			// console.log(desktop)
			// If the desktop is already on a screen, activate that screen
			const screenId = desktop.findScreenId();
			// console.log({screenId})
			if (screenId >= 0) {
				this._setCurrent(screenId);
			}
			// Otherwise, move the desktop to the current screen.
			else {
				// console.log(1)
				this.moveDesktopToScreen(desktop, this.currentScreen);
			}
		}
		return this;
	}

	public activateWindow(windowId: number): StateWrapper {
		// Find desktop
		const desktopId = this._findWidgetDekstopIdById(windowId);
		if (!_.isUndefined(desktopId)) {
			const desktop = this.desktopById(desktopId);
			if (desktop) {
				// Move window to front on desktop's chain
				desktop._childIdChain.unshift(windowId);
				// And activate the desktop
				this.activateDesktop(desktop);
			}
		}
		return this;
	}

	public activateWindowNext(window?: WhichWindow) {
		return this._activateWindowDir(window, true);
	}

	public activateWindowPrev(window?: WhichWindow) {
		return this._activateWindowDir(window, false);
	}

	public removeWindow(windowId: number) {
		if (_.isUndefined(windowId)) {
			windowId = this.currentWindowId;
		}

		// console.log({windowId, state: this.state})
		this.unparentWindow(windowId);
		this._windowIdOrder.remove(windowId);
		this._windowIdStack.remove(windowId);
		this._windowIdDetached.remove(windowId);
		this._widgetIdChain.remove(windowId);
		// Delete the widget from the widgets set
		const { [windowId.toString()]: dummy, ...widgets1 } = this.state.widgets;
		this.state = { ...this.state, widgets: widgets1 };
		this._setCurrent();
		// console.log({windowId, state: this.state})
		return this;
	}

	/**
	 * Toggle or set the floating state of a window.
	 *
	 * @param {number|WindowWrapper} [window] - window ID or window wrapper, or if undefined the current window.
	 * @param {boolean} [value] - value to force, or toggle if undefined.
	 */
	public toggleWindowFloating(which?: WhichWindow, value?: boolean) {
		const window = this.getWhichWindow(which);
		if (window) {
			window.flagFloating = _.isUndefined(value) ? !window.flagFloating : value;
		}
		return this;
	}

	public setWindowRequestedProperties(
		which: WhichWindow,
		props: { readonly [key: string]: any }
	) {
		const window = this.getWhichWindow(which);
		if (window) {
			window._update(["requested"], {}, m => ({ ...m, ...props }));
		}

		return this;
	}

	public unsetWindowFlag(window: WhichWindow, name: string) {
		if (_.isUndefined(window)) {
			window = this.currentWindow;
		} else if (_.isNumber(window)) {
			window = this.windowById(window);
		}

		if (window) {
			switch (name) {
				case "requestClose":
					window.set(set(window.data, x => x.flags.requestClose)(false));
					break;
				default:
					throw Error("Unknown window flag: " + name);
			}
		}

		return this;
	}

	public forEachScreen(fn: (screen: ScreenWrapper) => void) {
		// this.print();
		this.getScreenIdOrder().forEach(screenId => {
			const screen = this.screenById(screenId);
			fn(screen);
		});
		return this;
	}

	public mapEachScreen<T>(fn: (screen: ScreenWrapper) => T): ReadonlyArray<T> {
		return this.getScreenIdOrder().map(id => {
			const screen = this.screenById(id);
			return fn(screen);
		});
	}

	public forEachDesktop(fn: (desktop: DesktopWrapper) => void) {
		this.getDesktopIdOrder().forEach(id => {
			const desktop = this.desktopById(id);
			fn(desktop);
		});
		return this;
	}

	public forEachWindow(fn: (window: WindowWrapper) => void) {
		this.getWindowIdOrder().forEach(id => {
			const window = this.windowById(id);
			if (!window) {
				throw Error("No window for window ID " + id);
			}
			fn(window);
		});
		return this;
	}

	/* Private helper functions */

	public _has(path: WrapperPath): boolean {
		return _.has(this.state, [...path]);
	}

	public _get(path: WrapperPath, dflt: any): any {
		return _.get(this.state, [...path], dflt);
	}

	public _set(path: WrapperPath, value: any): StateWrapper {
		this.state = _.set(this.state, [...path], value);
		return this;
	}

	public _update<T>(path: WrapperPath, dflt: T, fn: (value0: undefined | T) => T) {
		if (_.isString(path)) {
			path = [path];
		}
		// console.log({path, dflt, fn})
		this.state = set(this.state, path.map(x => x.toString()))(fn);
		return this;
	}

	// public _widgetById(prototype, id: number) {
	// 	if (id >= 0) {
	// 		const path = this._widgetPath(id);
	// 		if (this._has(path)) {
	// 			return new prototype(this, path, id);
	// 		}
	// 	}
	// 	return undefined;
	// }

	public _activateWindowDir(window: WhichWindow, next: boolean): void {
		const result = this._calcWindowIndexDir(window, next);
		if (result) {
			const windowId = result.desktop._childIdOrder.get(result.indexNew);
			result.desktop._childIdChain.unshift(windowId);
			this._setCurrent();
		}
	}

	public _addWidget(w: Widget): number {
		// Add widget to widgets list
		const id = this.widgetIdNext;
		assert(id >= 0, "`widgetIdNext` must be >= 0");
		this.state = set(this.state, x => x.widgets[id.toString()])(w);

		// Increment ID counter
		this.state = set(this.state, x => x.widgetIdNext)(id + 1);

		return id;
	}

	/**
	 *
	 * @param window Which window to start with
	 * @param next True to move to the next, false to move to the previous
	 */
	public _calcWindowIndexDir(window: WhichWindow, next: boolean) {
		const offset = next ? 1 : -1;
		const found = this.findWindowNum(window, undefined, offset);
		if (found) {
			const { window: window2, desktop, num } = found;
			if (num >= 0) {
				return { window: window2, desktop, indexNew: num };
			}
		}
		return undefined;
	}

	public _findWidgetScreenIdById(widgetId: number): number {
		// console.log(`_findWidgetDekstopIdById(${widgetId})`);
		// console.log(this.state);
		const w = this._getWidgetById(widgetId);
		if (w) {
			if (w.type === "screen") {
				return widgetId;
			}
			const parentId = w.parentId;
			if (parentId >= 0) {
				return this._findWidgetScreenIdById(parentId);
			}
		}
		return -1;
	}

	public _findWidgetDekstopIdById(widgetId: number): number {
		// console.log(`_findWidgetDekstopIdById(${widgetId})`);
		// console.log(this.state);
		const w = this._getWidgetById(widgetId);
		if (w) {
			if (w.type === "desktop") {
				return widgetId;
			}
			const parentId = w.parentId;
			if (parentId >= 0) {
				return this._findWidgetDekstopIdById(parentId);
			}
		}
		return -1;
	}

	public _getWidgetById(id: number): Widget | undefined {
		return this.state.widgets[id.toString()];
	}

	public _moveWindowToIndexDir(window: WhichWindow, next: boolean) {
		const result = this._calcWindowIndexDir(window, next);
		// console.log({window, next, result})
		if (result) {
			result.desktop._childIdOrder.insert(result.window.id, result.indexNew);
			this._setCurrent();
		}
		return this;
	}

	/**
	 * Set the current screen.
	 * This will update widgetIdChain, currentScreenId, currentDesktopId, and currentWindowId.
	 * It will also make sure that if the current window has a modal dialog open,
	 * then that window will be focused if its on the current screen, or no
	 * window gets focus if the dialog is on another screen.
	 * @param {(number|ScreenWrapper)} [screen] - the screen to set as current
	 */
	public _setCurrent(which?: WhichScreen) {
		const screen = this.getWhichScreen(which);
		if (screen) {
			const desktop = screen.currentDesktop;
			// Update the widgetIdChain with respect to screen and desktop
			this._widgetIdChain.unshift(screen.id).unshift(desktop.id);
			// If a window is selected:
			if (desktop.currentWindowId >= 0) {
				/*// If the window has a modal dialog, switch focus to that window.
				const w = this.windowById(desktop.currentWindowId);
				w.getModalIdOrder().forEach(depId => {
					const dep = this.windowById(depId);
					console.log({dep: _.omit(dep, 'top'), w: dep._get([])});
					if (dep.flagModal) {
						const desktopIdDep = dep.findDesktopId();
						console.log({desktopIdDep, desktopId: desktop.id})
						if (desktopIdDep === desktop.id) {
							// Move dialog to front on desktop's chain
							desktop._childIdChain.unshift(dep.id);
						}
						else {
							// Force lack of focus
							desktop._childIdChain.unshift(-1);
						}
						return false;
					}
				});*/
				// Update the widgetIdChain with respect to the window
				this._widgetIdChain.unshift(desktop.currentWindowId);
			}
			// Update the current pointers
			this._set(StatePaths.currentScreenId, screen.id)
				._set(StatePaths.currentDesktopId, desktop.id)
				._set(StatePaths.currentWindowId, desktop.currentWindowId);
		}
		return this;
	}

	private getWhichWindow(which?: WindowWrapper | number): WindowWrapper | undefined {
		return _.isUndefined(which)
			? this.currentWindow
			: _.isNumber(which)
				? this.windowById(which)
				: which;
	}

	private getWhichDesktop(which?: DesktopWrapper | number): DesktopWrapper | undefined {
		return _.isUndefined(which)
			? this.currentDesktop
			: _.isNumber(which)
				? this.desktopById(which)
				: which;
	}

	private getWhichScreen(which?: ScreenWrapper | number): ScreenWrapper | undefined {
		return _.isUndefined(which)
			? this.currentScreen
			: _.isNumber(which)
				? this.screenById(which)
				: which;
	}

	private _widgetPath(id: number, path: WrapperPath = []): WrapperPath {
		return ["widgets", id.toString(), ...path];
	}
}
