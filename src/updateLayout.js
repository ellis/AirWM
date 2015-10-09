import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';

export default function updateLayout(builder) {
	//console.log("updateLayout")
	//console.log(state)
	// For each screen, update desktop dimensions
	builder.forEachScreen(screen => {
		// Screen dimensions
		const rc = [0, 0, screen.width, screen.height];
		// Background layout
		const backgroundId = screen.backgroundId;
		if (backgroundId >= 0) {
			const w = builder.windowById(backgroundId);
			w.visible = true;
			w.setRc(rc);
		}
		// Dock layout
		screen.getDockIdOrder().forEach(id => {
			const w = builder.windowById(id);
			const gravity = w._get('dockGravity', 'bottom');
			const size = w._get('dockSize', 50);
			let rc2;
			switch (gravity) {
				case 'left':
				case 'right':
				case 'top':
					rc2 = [rc[0], rc[1], rc[2], size];
					rc[1] += size;
					rc[3] -= size;
					break;
				default:
					rc2 = [rc[0], rc[3] - size + 1, rc[2], size];
					rc[3] -= size;
					break;
			}
			w.visible = true;
			w.setRc(rc2);
		});
		// Desktop layout
		screen.currentDesktop.setRc(rc);
	});

	const layoutEngines = {
		'tile-right': (desktopId) => layout_tileRight(state, desktopId),
		'default': (desktopId) => layout_mainLeft(state, desktopId)
	}

	// For each screen's desktop, update child dimensions
	builder.forEachDesktop(desktop => {
		const screenId = desktop.findScreenId();
		// If this desktop is displayed on a screen, update layout
		if (screenId >= 0) {
			layout_mainLeft(builder, desktop);
		}
		// Otherwise, set all children to hidden
		else {
			desktop.getChildIdOrder().forEach(childId => {
				builder.set(['widgets', childId.toString(), 'visible'], false);
			});
		}
	});
}

function layout_tileRight(state, desktopId) {
	const desktop = state.getIn(['widgets', desktopId.toString()]);
	const childIds = desktop.get('childIdOrder', List());
	let n = childIds.count();
	if (n > 0) {
		let [x, y, w, h] = desktop.get('rc');
		const padding = 5;
		x += padding;
		w -= 2 * padding;
		y += padding;
		h -= 2 * padding;
		const w2 = parseInt((w - (n - 1) * padding) / n);
		childIds.forEach((childId, i) => {
			const x2 = x + i * (w2 + padding);
			state = state.
				setIn(['widgets', childId.toString(), 'rc'], List.of(
					x2, y, w2, h
				)).
				setIn(['widgets', childId.toString(), 'visible'], true);
		});
	}
	return state;
}

function layout_mainLeft(builder, desktop) {
	const childIds = desktop.getChildIdOrder();
	let n = childIds.count();
	let [x, y, w, h] = desktop.getRc().toJS();
	if (n == 1) {
		const padding = 5;
		x += padding;
		w -= 2 * padding;
		y += padding;
		h -= 2 * padding;
		const childId = childIds.get(0);
		const child = builder.windowById(childId);
		child.setRc([x, y, w, h]);
		child.visible = true;
	}
	else if (n > 1) {
		const padding = 5;
		x += padding;
		w -= 2 * padding;
		y += padding;
		h -= 2 * padding;
		const w2 = parseInt((w - 1 * padding) / 2);
		// Dimensions for main window, takes up left half of screen
		const mainId = childIds.get(0);
		const main = builder.windowById(mainId);
		main.setRc([x, y, w2, h]);
		main.visible = true;
		// Remaining children take up right half of screen
		const x2 = x + (w2 + padding);
		const h2 = parseInt((h - (n-2)*padding) / (n - 1));
		childIds.shift().forEach((childId, i) => {
			const y2 = y + i * (h2 + padding);
			const child = builder.windowById(childId);
			child.setRc([x2, y2, w2, h2]);
			child.visible = true;
		});
	}
}
