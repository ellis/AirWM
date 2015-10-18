import _ from 'lodash';
import assert from 'assert';
import {List, Map} from 'immutable';

export default function updateLayout(builder) {
	//console.log("updateLayout")
	//console.log(state)
	// For each screen, update desktop dimensions
	builder.forEachScreen(screen => {
		// Screen dimensions
		const rc0 = [0, 0, screen.width, screen.height];
		// Background layout
		const backgroundId = screen.backgroundId;
		if (backgroundId >= 0) {
			const w = builder.windowById(backgroundId);
			w.visible = true;
			w.setRc(rc0);
		}
		// Dimenions left over for desktop windows after dock placement
		const rc = _.clone(rc0);
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
					rc2 = [rc0[0], rc0[1], rc0[2], size];
					rc[1] += size;
					rc[3] -= size;
					break;
				case 'bottom':
				default:
					rc2 = [rc0[0], rc0[3] - size + 1, rc0[2], size];
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
				builder._set(['widgets', childId.toString(), 'visible'], false);
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
	const childIds0 = desktop.getChildIdOrder().toJS();
	const [childIds, floatIds] = _.partition(childIds0, id => {
		const w = builder.windowById(id);
		return (w._get(['state', 'floating'], false) == false);
	});

	let n = childIds.length;
	let [x, y, w, h] = desktop.getRc().toJS();
	if (n == 1) {
		const padding = 5;
		x += padding;
		w -= 2 * padding;
		y += padding;
		h -= 2 * padding;
		const childId = childIds[0];
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
		const mainId = childIds[0];
		const main = builder.windowById(mainId);
		main.setRc([x, y, w2, h]);
		main.visible = true;
		// Remaining children take up right half of screen
		const x2 = x + (w2 + padding);
		const h2 = parseInt((h - (n-2)*padding) / (n - 1));
		_.rest(childIds).forEach((childId, i) => {
			const y2 = y + i * (h2 + padding);
			const child = builder.windowById(childId);
			child.setRc([x2, y2, w2, h2]);
			child.visible = true;
		});
	}

	// Try to give floating windows their requested size and position
	floatIds.forEach(childId => {
		const child = builder.windowById(childId);
		const rc = child.getRc().toJS() || [0, 0, 100, 100];

		const requestedPos = child.getRequestedPos();
		if (requestedPos) {
			rc[0] = requestedPos.get(0);
			rc[1] = requestedPos.get(1);
		}

		const requestedSize = child.getRequestedSize();
		if (requestedSize) {
			rc[2] = requestedSize.get(0);
			rc[3] = requestedSize.get(1);
		}

		child.setRc(rc);
		child.visible = true;
	});
}
