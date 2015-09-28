import {List, Map} from 'immutable';
import {expect} from 'chai';

import * as core from '../lib/core.js';

describe('application logic', () => {

	describe('setContainers', () => {
		it('adds the containers to the state', () => {
			const state = Map();
			const containers = {
				0: {
					name: "web"
				}
			};
			const nextState = core.setContainers(state, containers);
			expect(nextState).to.equal(Map({
				containers: Map(containers)
			}));
		});
	});

	describe('setScreens', () => {
		it('adds the screens to the state', () => {
			const state = Map();
			const screens = {
				0: {
					width: 800,
					height: 600
				}
			};
			const nextState = core.setScreens(state, screens);
			expect(nextState).to.equal(Map({
				screens: Map(screens)
			}));
		});
	});
});
