import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';

describe('StateWrapper', () => {
	it('test1', () => {
		const builder = new StateWrapper(initialState);
		expect(builder.getState()).to.equal(initialState);

		// Add desktop 1
		const d1 = builder.addDesktop({});
		expect(builder.getWidgetIdNext()).to.equal(d1 + 1);
		expect(builder.getDesktopIdOrder()).to.equal(List.of(d1));
		expect(builder.getDesktopIdChain()).to.equal(List.of(d1));
		expect(builder.desktopById(d1).screenId).to.equal(-1);
		// Add desktop 2
		const d2 = builder.addDesktop({});
		expect(builder.getWidgetIdNext()).to.equal(d2 + 1);
		expect(builder.getDesktopIdOrder()).to.equal(List.of(d1, d2));
		expect(builder.getDesktopIdChain()).to.equal(List.of(d1, d2));
		expect(builder.desktopById(d1).screenId).to.equal(-1);
		expect(builder.desktopById(d2).screenId).to.equal(-1);
		// Add screen 1
		const s1 = builder.addScreen({
			xid: 100,
			width: 800,
			height: 600,
		});
		expect(builder.getWidgetIdNext()).to.equal(s1 + 1);
		expect(builder.getDesktopIdOrder()).to.equal(List.of(d1, d2));
		expect(builder.getDesktopIdChain()).to.equal(List.of(d1, d2));
		expect(builder.getScreenIdOrder()).to.equal(List.of(s1));
		expect(builder.getScreenIdChain()).to.equal(List.of(s1));
		expect(builder.screenById(s1).getDesktopIdChain()).to.equal(List.of(d1, d2));
		expect(builder.desktopById(d1).screenId).to.equal(s1);
		expect(builder.desktopById(d2).screenId).to.equal(-1);

		//expect(builder.desktopIdOrder.getState()).to.equal(List.of(1,2,3));

		//builder.desktopIdOrder.push(4);
		//expect(builder.getState().get('desktopIdOrder')).to.equal(List.of(1,2,3,4));
	});
});
