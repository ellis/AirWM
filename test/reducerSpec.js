import {Map, fromJS} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import reducer from '../lib/reducer.js';

/*describe('reducer', () => {
	it('handles INITIALIZE', () => {
		const action = {
			type: 'INITIALIZE',
			desktops: [
				{
					name: "web",
					layout: "tile-right"
				}
			],
			screens: [
				{
					xidRoot: screen0_xidRoot,
					width: 800,
					height: 600,
				}
			]
		};
		const state = reducer(Map(), action);
	});
});
*/
