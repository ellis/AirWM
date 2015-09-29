import {List, Map} from 'immutable';
import Immutable from 'immutable';
import {expect} from 'chai';
import diff from 'immutablediff';

import * as core from '../lib/core.js';
import * as ex from './exampleStates.js';


describe('application logic', () => {

	describe('initialize', () => {
		it('initializes the state with desktops and screens', () => {
			const desktops = [
				{
					name: "web",
					layout: "tile-right"
				}
			];
			const screens = [
				{
					xidRoot: ex.screen0_xidRoot,
					width: 800,
					height: 600,
				}
			];
			const state = core.initialize(desktops, screens);
			//console.log(state);
			//console.log(diff(state, state110));
			expect(state).is.equal(ex.state110);
		});
	});

	describe('addXwin', () => {
		const widget1 = {
			xid: 1001
		};
		const state1 = core.addWidget(ex.state110, widget1);
		describe('adding first window', () => {
			let state = state1;
			it('should set focus to that window', () => {
				expect(state.getIn(['focusCurrentId'])).to.equal(1);
				expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(1);
				expect(state.getIn(['x11', 'focusXid'])).to.equal(1001);
			});
			it('should add window to the current desktop', () => {
				expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(1));
				expect(state.getIn(['widgets', '1', 'parentId'])).to.equal(0);
				expect(state.getIn(['widgets', '1', 'desktopNum'])).to.equal(0);
			});
			it('should make the window visible', () => {
				expect(state.getIn(['widgets', '1', 'visible'])).to.equal(true);
			});
			it('should equal fully specified state', () => {
				//console.log(JSON.stringify(nextState.toJS(), null, '\t'));
				//console.log(diff(nextState, expected1));
				expect(state).to.equal(ex.state111);
			});
		});

		const widget2 = {
			xid: 1002
		};
		const state2 = core.addWidget(state1, widget2);
		describe('adding second window', () => {
			let state = state2;
			it('should leave the focus on the first window', () => {
				expect(state.getIn(['focusCurrentId'])).to.equal(1);
				expect(state.getIn(['widgets', '0', 'focusCurrentId'])).to.equal(1);
				expect(state.getIn(['x11', 'focusXid'])).to.equal(1001);
			});
			it('should add window to the current desktop', () => {
				expect(state.getIn(['widgets', '0', 'childIds'])).to.equal(List.of(1, 2));
				expect(state.getIn(['widgets', '2', 'parentId'])).to.equal(0);
				expect(state.getIn(['widgets', '2', 'desktopNum'])).to.equal(0);
			});
			it('should make the window visible', () => {
				expect(state.getIn(['widgets', '2', 'visible'])).to.equal(true);
			});
			it('should equal fully specified state', () => {
				//console.log(JSON.stringify(nextState.toJS(), null, '\t'));
				//console.log(diff(nextState, expected1));
				expect(state).to.equal(ex.state112);
			});
		});
	});
});
