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
		focusXid: screen0_xidRoot,
		desktopNum: 0
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
			rc: [5, 5, 790, 590],
			parentId: 0
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
		focusXid: 1001,
		desktopNum: 0
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
			rc: [5, 5, 392, 590]
		},
		2: {
			xid: 1002,
			parentId: 0,
			rc: [402, 5, 392, 590]
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
		focusXid: 1001,
		desktopNum: 0
	}
});
