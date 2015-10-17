import _ from 'lodash';
import {expect} from 'chai';

/**
 * Take a flat list of JSON path + value pairs and makes sure the state matches.
 * @param  {string} desc - description of what's being checked
 * @param  {array} stuff - the flat list of path/value pairs to chekc
 */
export default function checkList(builder, desc, stuff) {
	const state = builder.getState().toJS();
	_.chunk(stuff, 2).forEach(l => {
		const [key, expected] = l;
		const actual = _.get(state, key);
		if (_.isUndefined(expected))
			expect(actual, desc+": "+key).to.be.undefined;
		else
			expect(actual, desc+": "+key).to.deep.equal(expected);
	})
}
