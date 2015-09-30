import {fromJS} from 'immutable';

export const screen0_xidRoot = 100;

export const state110 = fromJS({
	widgets: {
		0: {
			name: "web",
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right"
		}
	},
	screens: {
		0: {
			xidRoot: screen0_xidRoot,
			width: 800,
			height: 600,
			desktopCurrentId: 0
		}
	},
	desktopIds: [0],
	screenCurrentId: 0,
	x11: {
		desktopNum: 0,
		wmSettings: {
			SetInputFocus: [screen0_xidRoot]
		}
	}
});

export const state111 = fromJS({
	widgets: {
		0: {
			name: "web",
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right",
			childIds: [1],
			focusCurrentId: 1
		},
		1: {
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
			desktopCurrentId: 0
		}
	},
	desktopIds: [0],
	screenCurrentId: 0,
	focusCurrentId: 1,
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
						"borderPixel": 0
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
			name: "web",
			screenId: 0,
			rc: [0, 0, 800, 600],
			layout: "tile-right",
			childIds: [1, 2],
			focusCurrentId: 1
		},
		1: {
			xid: 1001,
			parentId: 0,
			rc: [5, 5, 392, 590],
			visible: true
		},
		2: {
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
			desktopCurrentId: 0
		}
	},
	desktopIds: [0],
	screenCurrentId: 0,
	focusCurrentId: 1,
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
						"borderPixel": 0
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
						"borderPixel": 0
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
