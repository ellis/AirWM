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
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right",
			childIdOrder: [1],
			childIdStack: [1]
		},
		1: {
			type: "window",
			xid: 1001,
			parentId: 0,
			rc: [5, 5, 790, 590],
			visible: true
		}
	},
	screens: {
		0: {
			xidRoot: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopIdStack: [0]
		}
	},
	widgetIdNext: 2,
	screenIdOrder: [0],
	screenIdStack: [0],
	desktopIdOrder: [0],
	desktopIdStack: [0],
	windowIdOrder: [1],
	windowIdStack: [1],
	x11: {
		desktopNum: 0,
		wmSettings: {
			SetInputFocus: [1001]
		},
		windowSettings: {
			"1": {
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
						"stackMode": 0
					}
				]
			}
		}
	}
});

export const state112 = fromJS({
	widgets: {
		0: {
			type: "desktop",
			name: "web",
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right",
			childIdOrder: [1, 2],
			childIdStack: [1, 2]
		},
		1: {
			type: "window",
			xid: 1001,
			parentId: 0,
			rc: [5, 5, 392, 590],
			visible: true
		},
		2: {
			type: "window",
			xid: 1002,
			parentId: 0,
			rc: [402, 5, 392, 590],
			visible: true
		}
	},
	screens: {
		0: {
			xidRoot: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopIdStack: [0]
		}
	},
	widgetIdNext: 3,
	screenIdOrder: [0],
	screenIdStack: [0],
	desktopIdOrder: [0],
	desktopIdStack: [0],
	windowIdOrder: [1, 2],
	windowIdStack: [1, 2],
	x11: {
		desktopNum: 0,
		wmSettings: {
			SetInputFocus: [1001]
		},
		windowSettings: {
			"1": {
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
						"x": 5,
						"y": 5,
						"width": 382,
						"height": 580,
						"borderWidth": 5,
						"stackMode": 0
					}
				]
			},
			"2": {
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
						"stackMode": 0
					}
				]
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
