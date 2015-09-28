import _ from 'lodash';

function getNumber(obj, paths, _default = undefined) {
	for (let path of paths) {
		let n = _.get(obj, path);
		if (_.isNumber(n))
			return n;
	}
	return _default;
}

export default class Style {
	constructor(props) {
		_.merge(this, props);
	}

	get marginLeft() { return getNumber(['margin.left', 'margin'], 0); }
	get marginRight() { return getNumber(['margin.right', 'margin'], 0); }
	get marginTop() { return getNumber(['margin.top', 'margin'], 0); }
	get marginBottom() { return getNumber(['margin.bottom', 'margin'], 0); }

	get paddingLeft() { return getNumber(['padding.left', 'padding'], 0); }
	get paddingRight() { return getNumber(['padding.right', 'padding'], 0); }
	get paddingTop() { return getNumber(['padding.top', 'padding'], 0); }
	get paddingBottom() { return getNumber(['padding.bottom', 'padding'], 0); }
}
