import {createStore} from 'redux';
import reducer from './reducer.js';

export default function makeStore() {
	return createStore(reducer);
}
