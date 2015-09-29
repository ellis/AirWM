import makeStore from './lib/store.js';
import startServer from './lib/server.js';

export const store = makeStore();
startServer(store);
