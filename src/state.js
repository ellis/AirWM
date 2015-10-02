import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';


function statePrint(state) {
	console.log(JSON.stringify(state.toJS(), null, '\t'));
}

function stateCheck(state) {
	// Each screen has a desktop, and that desktop references the screen
	state.get('screens').forEach((screen, key) => {
		const screenId = parseInt(key);
		const desktopId = screen.getIn(['desktopIdStack', 0]);
		assert(_.isNumber(desktopId), `screens[${key}].desktopIdStack[0]: should be numeric`);
		if (state.getIn(['widgets', desktopId.toString(), 'screenId']) !== screenId) {
			statePrint(state)
		}
		assert.equal(state.getIn(['widgets', desktopId.toString(), 'screenId']), screenId);
	});

	// Desktops and their children
	state.get('desktopIdOrder').forEach(desktopId => {
		const desktop = stateGetDesktop(state, desktopId);
		const childIdOrder = desktop.get('childIdOrder', List());
		const childIdStack = desktop.get('childIdStack', List());
		// childIdStack is a permutation of childIdOrder
		assert(childIdOrder.isSubset(childIdStack) && childIdStack.isSubset(childIdOrder), `should be permutations: childIdOrder=${childIdOrder} and childIdStack=${childIdStack}`);
		// Each child references this desktop
		childIdOrder.forEach(childId => {
			// FIXME: for debug only
			if (_.isUndefined(stateGetWindow(state, childId))) {
				console.log("WOOPS:!!!!!!!!!!!!!!!")
				statePrint(state);
			}
			// ENDFIX
			assert.equal(stateGetWindow(state, childId).get('parentId'), desktopId);
		});
	});
}

const stateGetScreen = (state, screenId) => state.getIn(['screens', screenId.toString()]);
const stateGetCurrentScreenId = (state) => state.getIn(['screenIdStack', 0]);
const stateGetCurrentScreen = (state) => stateGetScreen(state, stateGetCurrentScreenId(state));

const stateGetWidget = (state, id) => state.getIn(['widgets', id.toString()]);

const stateGetDesktop = stateGetWidget;
/**
 * Get ID of current desktop.
 * @param {object} state - current state.
 * @param {number} [screenId] - If screen ID is passed, find the current desktop ID on that screen.
 * @return {number} ID of current desktop or current desktop on a given screen.
 */
const stateGetCurrentDesktopId = (state, screenId) =>
	(_.isUndefined(screenId))
		? state.getIn(['desktopIdStack', 0])
		: state.getIn(['screens', screenId.toString(), 'desktopIdStack', 0]);
const stateGetCurrentDesktop = (state, screenId) =>
	stateGetDesktop(state, stateGetCurrentDesktopId(state, screenId));

const stateGetWindow = stateGetWidget;
//const stateGetCurrentWindow

function stateRemoveWindowFromDesktop(state, id) {
	const desktopId = getWidgetDesktopId(state, id);
	assert(state.getIn(['widgets', id.toString(), 'parentId']) === desktopId);
	assert(state.getIn(['widgets', desktopId.toString(), 'childIdOrder']).indexOf(id) >= 0);
	return state
		.deleteIn(['widgets', id.toString(), 'parentId'])
		.updateIn(
			['widgets', desktopId.toString(), 'childIdOrder'],
			l => l.delete(l.indexOf(id))
		)
		.updateIn(
			['widgets', desktopId.toString(), 'childIdStack'],
			l => l.delete(l.indexOf(id))
		);
}

function stateAddWindowToDesktop(state, w, id, desktopId, order, stack = 1) {
	return state
		.setIn(['widgets', id.toString()], w.set('parentId', desktopId))
		.updateIn(
			['widgets', desktopId.toString(), 'childIdOrder'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				if (order >= l.count()) return l.push(id);
				else if (_.isNumber(order)) return l.splice(order, 0, id);
				else return l.push(id);
			}
		)
		.updateIn(
			['widgets', desktopId.toString(), 'childIdStack'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				if (stack >= l.count()) return l.push(id);
				else if (_.isNumber(stack)) return l.splice(stack, 0, id);
				else return l.unshift(id);
			}
		);
}

function stateUpdateWindowStacks(state, id) {
	assert(_.isNumber(id));
	const desktopId = getWidgetDesktopId(state, id);
	assert(_.isNumber(desktopId));
	return state
		.updateIn(
			['windowIdStack'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				return l.unshift(id);
			}
		)
		.updateIn(
			['widgets', desktopId.toString(), 'childIdStack'],
			List(),
			l => {
				const i = l.indexOf(id);
				if (i >= 0)
					l = l.delete(i);
				return l.unshift(id);
			}
		);
}

// Bring the desktop to the front of the given stack
function stateRaiseDesktopInStack(state, desktopId, path) {
	let desktopIdStack = state.getIn(path);
	// FIXME: for debug only
	if (_.isUndefined(desktopIdStack)) {
		console.log({path})
		console.log(state.getIn(['screens', '0']))
	}
	// ENDFIX
	const i = desktopIdStack.indexOf(desktopId);
	if (i >= 0)
		desktopIdStack = desktopIdStack.delete(i);
	desktopIdStack = desktopIdStack.unshift(desktopId);
	return state.setIn(path, desktopIdStack);
}

function stateRaiseDesktopInScreenStack(state, desktopId, screenId) {
	return stateRaiseDesktopInStack(state, desktopId, ['screens', screenId.toString(), 'desktopIdStack']);
}

function stateRaiseDesktopInWmStack(state, desktopId) {
	return stateRaiseDesktopInStack(state, desktopId, ['desktopIdStack']);
}

// Does not update WM stacks
function stateSwapDesktopsOnScreens(state, screenId1, screenId2) {
	assert(_.isNumber(screenId1));
	assert(_.isNumber(screenId2));
	const desktopId1 = state.getIn(['screens', screenId1.toString(), 'desktopIdStack', 0]);
	const desktopId2 = state.getIn(['screens', screenId2.toString(), 'desktopIdStack', 0]);
	// Swap screen references
	state = state
		.setIn(['widgets', desktopId1.toString(), 'screenId'], screenId2)
		.setIn(['widgets', desktopId2.toString(), 'screenId'], screenId1);
	state = stateRaiseDesktopInScreenStack(state, desktopId1, screenId2);
	state = stateRaiseDesktopInScreenStack(state, desktopId2, screenId1);
	stateCheck(state);
	return state;
}

/**
 * Raise a hidden desktop onto a screen.
 * @param  {object} state
 * @param  {number} desktopId - desktop to raise
 * @param  {number} screenId - screen to place desktop on
 * @return {object} new state
 */
function raiseDesktopOnScreen(state, desktopId, screenId) {
	//console.log(`raiseDesktopOnScreen: screenId=${screenId}, desktopId=${desktopId}`)
	assert(_.isNumber(desktopId));
	assert(_.isNumber(screenId));
	assert(_.isUndefined(state.getIn(['widgets', desktopId.toString(), 'screenId'])), `raiseDesktop: widgets[${desktopId}].screenId should be undefined.`);
	const desktopPrevId = state.getIn(['screens', screenId.toString(), 'desktopIdStack', 0]);
	//console.log({desktopPrevId})
	if (desktopId !== desktopPrevId) {
		// Remove screen reference from the screen's previous desktop
		if (desktopPrevId >= 0)
			state = state.deleteIn(['widgets', desktopPrevId.toString(), 'screenId']);
		// Set screen reference in new desktop
		state = state.setIn(['widgets', desktopId.toString(), 'screenId'], screenId);
		state = stateRaiseDesktopInScreenStack(state, desktopId, screenId);
	}
	return state;
}

function raiseDesktopOnWm(state, desktopId) {
	//console.log(`setScreenDesktop: screenId=${screenId}, desktopId=${desktopId}`)
	assert(_.isNumber(desktopId));
	assert(_.isNumber(screenId));
	const desktopPrevId = state.getIn(['screens', screenId.toString(), 'desktopIdStack', 0]);
	//console.log({desktopPrevId})
	if (desktopId !== desktopPrevId) {
		// Remove screen reference from the screen's previous desktop
		if (desktopPrevId >= 0)
			state = state.deleteIn(['widgets', desktopPrevId.toString(), 'screenId']);
		// Set screen reference in new desktop
		state = state.setIn(['widgets', desktopId.toString(), 'screenId'], screenId);
		state = stateRaiseDesktopInScreenStack(state, desktopId, screenId);
	}
	return state;
}


const State = {
	print: statePrint,
	check: stateCheck,

	getScreen: stateGetScreen,
	getCurrentScreenId: stateGetCurrentScreenId,
	getCurrentScreen: stateGetCurrentScreen,
	getWidget: stateGetWidget,
	getDesktop: stateGetDesktop,
	getCurrentDesktopId: stateGetCurrentDesktopId,
	getCurrentDesktop: stateGetCurrentDesktop,
	getWindow: stateGetWindow,

	swapDesktopsOnScreens: stateSwapDesktopsOnScreens,
	raiseDesktopOnScreen,
	raiseDesktopInWmStack: stateRaiseDesktopInWmStack,
};

export default State;

//stateRemoveWindowFromDesktop(state, id) {
//stateAddWindowToDesktop(state, w, id, desktopId, order, stack = 1) {
//stateUpdateWindowStacks(state, id) {
//stateSetScreenDesktop
