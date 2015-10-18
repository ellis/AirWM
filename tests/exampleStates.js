import {fromJS} from 'immutable';

export const screen0_xidRoot = 100;
export const screen1_xidRoot = 101;

export const state110 = fromJS({
	widgets: {
		0: {
			type: "desktop",
			name: "web",
			parentId: 1,
			rc: [0, 0, 800, 600],
			layout: "default",
			childIdOrder: [],
			childIdChain: []
		},
		1: {
			type: 'screen',
			xid: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopIdChain: [0]
		}
	},
	widgetIdNext: 2,
	screenIdOrder: [1],
	desktopIdOrder: [0],
	windowIdOrder: [],
	widgetIdChain: [0, 1],
	currentScreenId: 1,
	currentDesktopId: 0,
	currentWindowId: -1,
	x11: {
		wmSettings: {
			SetInputFocus: [screen0_xidRoot]
		}
	}
});

export const state111 = fromJS({
	widgets: {
		0: {
			type: "desktop",
			name: "web",
			parentId: 1,
			rc: [0, 0, 800, 600],
			layout: "default",
			childIdOrder: [2],
			childIdChain: [2]
		},
		1: {
			type: 'screen',
			xid: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopIdChain: [0]
		},
		2: {
			type: "window",
			xid: 1001,
			parentId: 0,
			state: {},
			rc: [5, 5, 790, 590],
			visible: true
		}
	},
	widgetIdNext: 3,
	screenIdOrder: [1],
	desktopIdOrder: [0],
	windowIdOrder: [2],
	widgetIdChain: [2, 0, 1],
	windowIdStack: [2],
	currentScreenId: 1,
	currentDesktopId: 0,
	currentWindowId: 2,
	x11: {
		wmSettings: {
			SetInputFocus: [1001],
			"ewmh": {
				"_NET_ACTIVE_WINDOW": [1001],
				"_NET_CLIENT_LIST": [1001],
				"_NET_CLIENT_LIST_STACKING": [1001]
			}
		},
		windowSettings: {
			"2": {
				"xid": 1001,
				"visible": true,
				"desktopNum": 0,
				"ChangeWindowAttributes": [
					1001,
					{
						"borderPixel": 0,
						eventMask: 16
					}
				],
				"ConfigureWindow": [
					1001,
					{
						x: 5,
						y: 5,
						"width": 780,
						"height": 580,
						"borderWidth": 5,
					}
				],
				"ewmh": {
					"WM_STATE": {
						"state": 1,
						"icon": 0
					},
					"_NET_WM_DESKTOP": [
						0
					],
					"_NET_WM_ALLOWED_ACTIONS": [
						"_NET_WM_ACTION_CLOSE"
					]
				}
			}
		}
	}
});

export const state112 = fromJS({
	widgets: {
		0: {
			type: "desktop",
			name: "web",
			parentId: 1,
			rc: [0, 0, 800, 600],
			layout: "default",
			childIdOrder: [2, 3],
			childIdChain: [2, 3]
		},
		1: {
			type: 'screen',
			xid: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopIdChain: [0]
		},
		2: {
			type: "window",
			xid: 1001,
			parentId: 0,
			state: {},
			rc: [5, 5, 392, 590],
			visible: true
		},
		3: {
			type: "window",
			xid: 1002,
			parentId: 0,
			state: {},
			rc: [402, 5, 392, 590],
			visible: true
		}
	},
	widgetIdNext: 4,
	screenIdOrder: [1],
	desktopIdOrder: [0],
	windowIdOrder: [2, 3],
	widgetIdChain: [2, 0, 1, 3],
	windowIdStack: [2, 3],
	currentScreenId: 1,
	currentDesktopId: 0,
	currentWindowId: 2,
	x11: {
		wmSettings: {
			SetInputFocus: [1001],
			"ewmh": {
				"_NET_ACTIVE_WINDOW": [
					1001
				],
				"_NET_CLIENT_LIST": [
					1001,
					1002
				],
				"_NET_CLIENT_LIST_STACKING": [
					1002,
					1001
				]
			}
		},
		windowSettings: {
			"2": {
				"xid": 1001,
				"visible": true,
				"desktopNum": 0,
				"ChangeWindowAttributes": [
					1001,
					{
						"borderPixel": 0,
						eventMask: 16
					}
				],
				"ConfigureWindow": [
					1001,
					{
						x: 5,
						y: 5,
						"width": 382,
						"height": 580,
						"borderWidth": 5,
						"stackMode": 0,
						"sibling": 1002
					}
				],
				"ewmh": {
					"WM_STATE": {
						"state": 1,
						"icon": 0
					},
					"_NET_WM_DESKTOP": [
						0
					],
					"_NET_WM_ALLOWED_ACTIONS": [
						"_NET_WM_ACTION_CLOSE"
					]
				}
			},
			"3": {
				"xid": 1002,
				"visible": true,
				"desktopNum": 0,
				"ChangeWindowAttributes": [
					1002,
					{
						"borderPixel": 0,
						eventMask: 16
					}
				],
				"ConfigureWindow": [
					1002,
					{
						"x": 402,
						"y": 5,
						"width": 382,
						"height": 580,
						"borderWidth": 5,
					}
				],
				"ewmh": {
					"WM_STATE": {
						"state": 1,
						"icon": 0
					},
					"_NET_WM_DESKTOP": [
						0
					],
					"_NET_WM_ALLOWED_ACTIONS": [
						"_NET_WM_ACTION_CLOSE"
					]
				}
			}
		}
	}
});

export const state120 = fromJS({
	widgets: {
		0: {
			type: "desktop",
			name: "web",
			parentId: 2,
			rc: [0, 0, 800, 590],
			layout: "default",
			childIdOrder: [],
			childIdChain: []
		},
		1: {
			type: "desktop",
			name: "web",
			rc: [0, 0, 800, 590],
			layout: "default",
			childIdOrder: [],
			childIdChain: []
		},
		2: {
			type: 'screen',
			xid: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopIdChain: [0],
			dockIdOrder: [3]
		},
		3: {
			type: "dock",
			xid: 2002,
			parentId: 2,
			dockGravity: "bottom",
			dockSize: 10,
			rc: [0, 591, 800, 10],
			visible: true
		}
	},
	widgetIdNext: 4,
	screenIdOrder: [2],
	desktopIdOrder: [0, 1],
	windowIdOrder: [],
	widgetIdChain: [0, 2, 1],
	currentScreenId: 2,
	currentDesktopId: 0,
	currentWindowId: -1,
	x11: {
		desktopNum: 0,
		wmSettings: {
			SetInputFocus: [screen0_xidRoot],
			ewmh: {
				"_NET_NUMBER_OF_DESKTOPS": [2],
				"_NET_CURRENT_DESKTOP": [0]
			}
		},
		windowSettings: {
			"3": {
				"xid": 2000,
				"visible": true,
				"desktopNum": -1,
				"ChangeWindowAttributes": [
					2000,
					{
						"borderPixel": 0,
						eventMask: 16
					}
				],
				"ConfigureWindow": [
					2000,
					{
						"x": 0,
						"y": 591,
						"width": 800,
						"height": 10,
						"borderWidth": 0,
						"stackMode": 0
					}
				]
			}
		}
	}
});

export const state240 = fromJS({
	widgets: {
		0: {
			type: "desktop",
			name: "web",
			parentId: 4,
			rc: [0, 0, 800, 590],
			layout: "default",
			childIdOrder: [],
			childIdChain: []
		},
		1: {
			type: "desktop",
			name: "web",
			parentId: 5,
			rc: [0, 0, 800, 590],
			layout: "default",
			childIdOrder: [],
			childIdChain: []
		},
		2: {
			type: "desktop",
			name: "web",
			rc: [0, 0, 800, 590],
			layout: "default",
			childIdOrder: [],
			childIdChain: []
		},
		3: {
			type: "desktop",
			name: "web",
			rc: [0, 0, 800, 590],
			layout: "default",
			childIdOrder: [],
			childIdChain: []
		},
		4: {
			type: 'screen',
			xid: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopIdChain: [0],
			dockIdOrder: [6]
		},
		5: {
			type: 'screen',
			xid: screen1_xidRoot,
			width: 800,
			height: 600,
			desktopIdChain: [1],
			dockIdOrder: [7]
		},
		6: {
			type: "dock",
			xid: 2006,
			parentId: 4,
			dockGravity: "bottom",
			dockSize: 10,
			rc: [0, 591, 800, 10],
			visible: true
		},
		7: {
			type: "dock",
			xid: 2007,
			parentId: 5,
			dockGravity: "bottom",
			dockSize: 10,
			rc: [0, 591, 800, 10],
			visible: true
		}
	},
	widgetIdNext: 8,
	screenIdOrder: [4, 5],
	desktopIdOrder: [0, 1, 2, 3],
	windowIdOrder: [],
	widgetIdChain: [0, 4, 1, 2, 3, 5, 6, 7, 8],
	currentScreenId: 4,
	currentDesktopId: 0,
	currentWindowId: -1,
	x11: {
		desktopNum: 0,
		wmSettings: {
			SetInputFocus: [screen0_xidRoot],
			ewmh: {
				"_NET_NUMBER_OF_DESKTOPS": [4],
				"_NET_CURRENT_DESKTOP": [0]
			}
		},
		windowSettings: {
			"6": {
				"xid": 2006,
				"visible": true,
				"desktopNum": -1,
				"ChangeWindowAttributes": [
					2006,
					{
						"borderPixel": 0,
						eventMask: 16
					}
				],
				"ConfigureWindow": [
					2006,
					{
						"x": 0,
						"y": 591,
						"width": 800,
						"height": 10,
						"borderWidth": 0,
						"stackMode": 0
					}
				]
			},
			"7": {
				"xid": 2007,
				"visible": true,
				"desktopNum": -1,
				"ChangeWindowAttributes": [
					2007,
					{
						"borderPixel": 0,
						eventMask: 16
					}
				],
				"ConfigureWindow": [
					2007,
					{
						"x": 0,
						"y": 591,
						"width": 800,
						"height": 10,
						"borderWidth": 0,
						"stackMode": 0
					}
				]
			}
		}
	}
});
