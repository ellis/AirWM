import test from 'tape-catch';
import {List, Map, fromJS} from 'immutable';
//import diff from 'immutablediff';

import StateWrapper, {initialState} from '../src/StateWrapper.js';

test('StateWrapper', t => {
	const builder = new StateWrapper(initialState);
	const builder0 = builder.clone();
	// Add desktop 1
	const d1 = builder.addDesktop({});
	const builder1 = builder.clone();
	// Add desktop 2
	const d2 = builder.addDesktop({});
	const builder2 = builder.clone();
	// Add screen 1
	const s1 = builder.addScreen({
		xid: 100,
		width: 800,
		height: 600,
	});
	const builder3 = builder.clone();

	t.equal(builder0.getState(), initialState, 'state left unchanged');

	t.test(' addDesktop', t => {
		t.test('  with no screens, one desktop', t => {
			const builder = builder1;
			t.equal(builder.getWidgetIdNext(), d1 + 1,
				'should increment `widgetIdNext`');
			t.end();
		});
	});

	t.end();

	/*t.test('addDesktop', t => {
		t.test('with no screens, one desktop', () => {
			//const builderPrev = builder0;
			it('should increment `widgetIdNext`', () => {
				expect(builder.getWidgetIdNext()).to.equal(d1 + 1);
			});
			it('should leave the screen order list unchanged', () => {
				expect(builder.getScreenIdOrder()).to.equal(List());
			});
			it('should append to the desktop order list', () => {
				expect(builder.getDesktopIdOrder()).to.equal(List.of(d1));
			});
			it('should leave the winder order list unchanged', () => {
				expect(builder.getWindowIdOrder()).to.equal(List());
			});
			it('should append to the widget chain list', () => {
				expect(builder.getWidgetIdChain()).to.equal(List.of(d1));
			});
			it('should leave the focus references unchanged', () => {
				expect(builder.currentScreenId).to.equal(-1);
				expect(builder.currentDesktopId).to.equal(-1);
				expect(builder.currentWindowId).to.equal(-1);
			});
		});

		describe('with no screens, two desktops', () => {
			let builder, d1, d2, s1;
			const builder = new StateWrapper(initialState);
			const d1 = builder.addDesktop({});
			const d2 = builder.addDesktop({});
			it('should increment `widgetIdNext`', () => {
				expect(builder.getWidgetIdNext()).to.equal(d2 + 1);
			});
			it('should leave the screen order list unchanged', () => {
				expect(builder.getScreenIdOrder()).to.equal(List());
			});
			it('should append to the desktop order list', () => {
				expect(builder.getDesktopIdOrder()).to.equal(List.of(d1, d2));
			});
			it('should leave the winder order list unchanged', () => {
				expect(builder.getWindowIdOrder()).to.equal(List());
			});
			it('should append to the widget chain list', () => {
				expect(builder.getWidgetIdChain()).to.equal(List.of(d1, d2));
			});
			it('should leave the focus references unchanged', () => {
				expect(builder.currentScreenId).to.equal(-1);
				expect(builder.currentDesktopId).to.equal(-1);
				expect(builder.currentWindowId).to.equal(-1);
			});
		});
	}

	describe('with one screen, two desktops', () => {
		let builder, d1, d2, s1;
		before(() => {
			builder = new StateWrapper(initialState);
			d1 = builder.addDesktop({});
			d2 = builder.addDesktop({});
			s1 = builder.addScreen({
				xid: 100,
				width: 800,
				height: 600,
			});
		});
		it('should increment `widgetIdNext`', () => {
			expect(builder.getWidgetIdNext()).to.equal(s1 + 1);
		});
		it('should append to the screen order list', () => {
			expect(builder.getScreenIdOrder()).to.equal(List.of(s1));
		});
		it('should leave the desktop order list unchanged', () => {
			expect(builder.getDesktopIdOrder()).to.equal(List.of(d1, d2));
		});
		it('should leave the winder order list unchanged', () => {
			expect(builder.getWindowIdOrder()).to.equal(List());
		});
		it('should update the widget chain list', () => {
			expect(builder.getWidgetIdChain()).to.equal(List.of(-1, d1, s1, d2));
		});
		it('should update the focus references', () => {
			expect(builder.currentScreenId).to.equal(s1);
			expect(builder.currentDesktopId).to.equal(d1);
			expect(builder.currentWindowId).to.equal(-1);
		});
	});
	*/
});
