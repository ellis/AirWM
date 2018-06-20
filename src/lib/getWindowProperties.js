import * as _ from 'lodash';
import * as x11 from 'x11';

export default function getWindowProperties(X, id) {
    function decodeProperty(type, data) {
		return new Promise((resolve, reject) => {
			switch(type) {
				case 'ATOM':
					const ns = bytesToNumbers(data);
					//console.log("ATOM data: "+_.map(data, function(c) { return c.toString(); }));
					//console.log("ATOM ns: "+ns);
					const promises = _.map(ns, n => { return getAtomName(X, n); });
					resolve(Promise.all(promises));

				case 'CARDINAL':
					//return resolve([]);
					return resolve(bytesToNumbers(data));

				case 'INTEGER':
					return resolve(bytesToNumbers(data));

				case 'STRING':
					return resolve(bytesToString(data, 'ascii'));

				case 'UTF8_STRING':
					return resolve(bytesToString(data, 'utf8'));

				case 'WINDOW':
					var numAtoms = data.length/4;
					var res = [];
					for (var i=0; i < data.length; i+=4) {
						res.push(data.unpack('L', i)[0]);
					}
					return resolve(res);

				case 'WM_HINTS':
					return resolve(bytesToNumbers(data));

				case 'WM_STATE':
					return resolve(bytesToNumbers(data));

				default:
					return resolve('???:' + type+":"+_.map(data, function(c) { return c.toString(); }));
			}
		});
    }

	return new Promise((resolve, reject) => {
		X.ListProperties(id, (err, props) => {
			//console.log("A:"+props);
			const promises = props.map(p => {
				//console.log(p);
				return getWindowProperty(X, id, p).then(propValue => {
					//console.log("B: pid="+p);
					return getAtomName(X, propValue.type).then(typeName => {
						//console.log("C: pid="+p);
						return getAtomName(X, p).then(propName => {
							//console.log("D: pid="+p);
							return decodeProperty(typeName, propValue.data).then(decodedData => {
								//console.log("decoded: "+decodedData);
								//console.log(p + ': ' + propName + '(' + typeName + ') = ' + decodedData);
								return [propName, decodedData];
							}).catch(e => {console.log("ERROR: "+e.name + ': ' + e.message); console.log(e.stack); });
						});
					});
				});
			});

			//console.log("B:");
			resolve(Promise.all(promises).then(pairs => {
				return _.zipObject(pairs);
			}));
		});
	});
}

function getWindowProperty(X, wid, propertyId) {
	//console.log("A:", wid, propertyId);
	return new Promise(function(resolve, reject) {
		//console.log("B:");
		X.GetProperty(0, wid, propertyId, 0, 0, 10000000, function(err, result) {
			//console.log("C:", err, result);
			if (err) return reject(err);
			resolve(result);
		});
	});
}

function getAtomName(X, propertyId) {
	//console.log("getAtomName("+propertyId+")");
	return new Promise((resolve, reject) => {
		X.GetAtomName(propertyId, function(err, result) {
			if (err) return reject(err);
			resolve(result);
		});
	});
}

function bytesToString(bytes, encoding='utf8') {
	let buffer = new Buffer(bytes);
	//console.log("buffer: "+buffer);
	let s = buffer.toString(encoding);
	//console.log("s: "+s);
	return _.compact(new Buffer(bytes).toString(encoding).split('\u0000'))
}

function bytesToNumbers(bytes) {
	var res = [];
	for (var i=0; i < bytes.length; i+=4) {
		res.push(bytes.unpack('L', i)[0]);
	}
	return res;
}
