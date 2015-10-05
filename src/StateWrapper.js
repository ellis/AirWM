import _ from 'lodash';
import assert from 'assert';
import {List, Map, fromJS} from 'immutable';
import Immutable from 'seamless-immutable';

class ListWrapper {
	constructor(top, path) {
		this.top = top;
		this.path = path;
	}

	push(x) { this.top.updateIn(path, List(), l => l.push(x)); }
	unshift(x) { this.top.updateIn(path, List(), l => l.push(x)); }
	insert(x, index) { this.top.updateIn(path, List(), l => l.push(x)); }
}

class UniqueListWrapper {
	constructor(top, path) {
		this.top = top;
		this.path = path;
	}

	push(x) { this.top.updateIn(path, List(), l => l.push(x)); }
	unshift(x) { this.top.updateIn(path, List(), l => l.push(x)); }
	insert(x, index) { this.top.updateIn(path, List(), l => l.push(x)); }
}

export default class StateWrapper {
	constructor(state) {
		this.state = state;
	}

	get desktopIdStack = state.get('desktopIdStack');
	get desktopIdOrder = state

	updateIn(path, dflt, fn) {
		this.state = this.state.updateIn(path, dflt, fn);
	}
};
