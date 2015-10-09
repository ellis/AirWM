import _ from 'lodash';
import assert from 'assert';
import {List, Map, Set} from 'immutable';
import x11 from 'x11';

import x11consts from './x11consts.js';

export default function updateX11(builder) {
	const screen = builder.currentScreen;
	if (!screen)
		return;
	const desktop = builder.currentDesktop;
	const currentWindowId = builder.currentWindowId;
	let remainingKeys = Set(builder.state.getIn(['x11', 'windowSettings'], Map()).keys());
	//console.log({remainingKeys});
	builder.forEachWindow(w => {
		//console.log(w.id);
		remainingKeys = remainingKeys.delete(w.id.toString());
		const xid = w.xid;
		const isVisible = w.visible;
		if (xid) {
			const hasFocus = (w.id === currentWindowId);
			let info = builder._get(['x11', 'windowSettings', w.id.toString()], Map());
			info = info
				.set('xid', xid)
				.set('visible', isVisible)
				.setIn(['ewmh', 'WM_STATE', 'state'], x11consts.WM_STATE_NormalState) //(isVisible) ? x11consts.WM_STATE_NormalState : x11consts.WM_STATE_IconicState)
				.setIn(['ewmh', 'WM_STATE', 'icon'], 0);
			if (isVisible) {
				const desktop = w.findDesktop();
				const screen = w.findScreen();
				const screenX11 = builder._get(['x11', 'screens', screen.id.toString()], Map());
				const windowType = w.type;
				const borderWidth = _.get({
					'background': 0,
					'dock': 0,
					'window': 5,
				}, windowType, 1);
				const color = (hasFocus)
					? screenX11.getIn(['colors', 'focus'], 0)
					: screenX11.getIn(['colors', 'normal'], 0);
				const rc = w.getRc().toJS();
				const eventMask = _.get({
					'background': undefined,
					'dock': undefined,
				}, windowType, x11.eventMask.EnterWindow);
				const desktopNum = (desktop) ? builder.getDesktopIdOrder().indexOf(desktop.id) : -1;

				info = info
					.set('desktopNum', desktopNum)
					.update(
						'ChangeWindowAttributes',
						List.of(xid, Map()),
						m => m
							.setIn([1, 'borderPixel'], color)
							.setIn([1, 'eventMask'], eventMask)
					)
					.update(
						'ConfigureWindow',
						List.of(xid, Map()),
						m => m.update(1, x => x.merge({
							x: rc[0],
							y: rc[1],
							width: rc[2] - 2*borderWidth,
							height: rc[3] - 2*borderWidth,
							borderWidth: borderWidth,
							stackMode: (windowType === 'background') ? 1 : 0
						}))
					)
					.updateIn(
						['ewmh', '_NET_WM_DESKTOP'],
						List.of(0xFFFFFFFF),
						l => l.set(0, (windowType === 'window')
							? desktopNum
							: 0xFFFFFFFF
						)
					)
					.updateIn(
						['ewmh', '_NET_WM_ALLOWED_ACTIONS'],
						List(),
						l => (windowType === 'window')
							? l.set(0, '_NET_WM_ACTION_CLOSE')
							: l.clear()
					);
			}

			//console.log("info: "+xid);
			//console.log(info);
			builder._set(['x11', 'windowSettings', w.id.toString()], info);
		}
	});

	// TODO Stacking order: for each screen, docks at top, desktop windows in stack order, then background

	// If no widget is focused, set focus to the root window of the current screen
	const focusXid = (currentWindowId >= 0)
		? builder.currentWindow.xid
		: screen.xid;
	//console.log({currentWindowId, currentWindow: builder.currentWindow, focusXid, screen: _.omit(screen, 'top')});
	builder._update(['x11', 'wmSettings', 'SetInputFocus'], l => {
		if (l) return l.set(0, focusXid);
		else return List.of(focusXid);
	});

	// EWMH (Extended window manager hints)
	if (true) {
		// Number of desktops
		const desktopCount = builder.getDesktopIdOrder().count();
		builder._update(
			['x11', 'wmSettings', 'ewmh', '_NET_NUMBER_OF_DESKTOPS'],
			List.of(1),
			l => l.set(0, desktopCount)
		);
		// Current desktop
		const desktopNum = builder.getDesktopIdOrder().indexOf(desktop.id);
		builder._update(
			['x11', 'wmSettings', 'ewmh', '_NET_CURRENT_DESKTOP'],
			List.of(0),
			l => l.set(0, desktopNum)
		);
		// Active window
		builder._update(
			['x11', 'wmSettings', 'ewmh', '_NET_ACTIVE_WINDOW'],
			List.of(0),
			l => l.set(0, (currentWindowId >= 0) ? focusXid : 0)
		);
		// Window order
		const windowIdOrder = builder.getWindowIdOrder();
		builder._update(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST'], List(), l => l.setSize(windowIdOrder.count()));
		for (let i = 0; i < windowIdOrder.count(); i++) {
			const xid = builder.windowById(windowIdOrder.get(i)).xid;
			if (xid)
				builder._set(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST', i], xid);
		}
		/*
		// Window stacking
		const widgetIdStack = builder.getWidgetIdStack();
		builder.update(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST_STACKING'], List(), l => l.setSize(windowIdStack.count()));
		for (let i = 0; i < widgetIdStack.count(); i++) {
			const id = widgetIdStack.get(i);
			const xid = builder._get(['widgets', id.toString(), 'xid']);
			const type = builder._get(['widgets', id.toString(), 'type']);
			if (xid && type !== 'screen')
				builder._set(['x11', 'wmSettings', 'ewmh', '_NET_CLIENT_LIST_STACKING', i], xid);
		}
		*/
	}

	// Delete entries for windows which have been removed
	//console.log({remainingKeys});
	remainingKeys.forEach(id => {
		builder.state = builder.state.deleteIn(['x11', 'windowSettings', id.toString()]);
	});
}
