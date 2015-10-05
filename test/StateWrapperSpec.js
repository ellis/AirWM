import {List, Map, fromJS} from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import StateWrapper from '../src/StateWrapper.js';

describe('StateWrapper', () => {
	it('test1', () => {
		const builder = new StateWrapper(Map());
		expect(builder.getState()).to.equal(Map());

		builder.addDesktop({});

		//expect(builder.desktopIdOrder.getState()).to.equal(List.of(1,2,3));

		//builder.desktopIdOrder.push(4);
		//expect(builder.getState().get('desktopIdOrder')).to.equal(List.of(1,2,3,4));
	});
});
