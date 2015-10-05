import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';

describe('StateWrapper', () => {
	it('test1', () => {
		const builder = new StateWrapper(initialState);
		expect(builder.getState()).to.equal(initialState);

		builder.addDesktop({});
		expect(builder.getWidgetIdNext()).to.equal(1);
		expect(builder.getDesktopIdOrder()).to.equal(List.of(0));
		expect(builder.getDesktopIdVisit()).to.equal(List.of(0));
		builder.addDesktop({});
		expect(builder.getWidgetIdNext()).to.equal(2);
		expect(builder.getDesktopIdOrder()).to.equal(List.of(0, 1));
		expect(builder.getDesktopIdVisit()).to.equal(List.of(0, 1));

		//expect(builder.desktopIdOrder.getState()).to.equal(List.of(1,2,3));

		//builder.desktopIdOrder.push(4);
		//expect(builder.getState().get('desktopIdOrder')).to.equal(List.of(1,2,3,4));
	});
});
