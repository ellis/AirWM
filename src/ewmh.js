// Copied from node-ewmh: just here for convient reference -- delete later

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var os = require('os');
var async = require('async');
var set_property = require('x11-prop').set_property;

export default class EWMH {
	constructor(X, root) {
	    EventEmitter.call(this);
	    var self = this;
	    this.X = X;
	    this.root = root;
	    //this.X.on('event', this._handle_event.bind(this));
	};

	set_supported(list, cb) {
	    var self = this;
	    async.map(
	        list,
	        function(prop, cb) {
	            self.X.InternAtom(false, prop, cb);
	        },
	        function(err, results) {
	            if (err) {
	                if (cb) {
	                    cb(err);
	                }

	                return;
	            }

	            self._change_property(self.root, '_NET_SUPPORTED', self.X.atoms.ATOM, 32, results, cb);
	        }
	    );
	}

	set_number_of_desktops(n, cb) {
	    this._change_property(this.root, '_NET_NUMBER_OF_DESKTOPS', this.X.atoms.CARDINAL, 32, [ n ], cb);
	}

	set_current_desktop(d, cb) {
	    this._change_property(this.root, '_NET_CURRENT_DESKTOP', this.X.atoms.CARDINAL, 32, [ d ], cb);
	}

	update_window_list(list, cb) {
	    this._update_window_list(list, '_NET_CLIENT_LIST', cb);
	}

	update_window_list_stacking(list, cb) {
	    this._update_window_list(list, '_NET_CLIENT_LIST_STACKING', cb);
	}

	set_pid(wid, cb) {
	    this._change_property(wid, '_NET_WM_PID', this.X.atoms.CARDINAL, 32, [ process.pid ], cb);
	}

	set_hostname(wid, cb) {
	    this._change_property(wid, 'WM_CLIENT_MACHINE', this.X.atoms.STRING, 8, [ os.hostname() ], cb);
	}

	set_name(wid, name, cb) {
	    this._change_property(wid, '_NET_WM_NAME', 'UTF8_STRING', 8, name, cb);
	}

	set_class(wid, _class, cb) {
	    this._change_property(wid, 'WM_CLASS', 'UTF8_STRING', 8, _class, cb);
	}

	set_active_window(wid, cb) {
	    this._change_property(this.root, '_NET_ACTIVE_WINDOW', this.X.atoms.WINDOW, 32, [ wid ], cb);
	}

	set_desktop(wid, desktop, cb) {
	    this._change_property(wid, '_NET_WM_DESKTOP', this.X.atoms.CARDINAL, 32, [ desktop ], cb);
	}

	set_composite_manager_owner(wid, screenNo, cb) {
	    var self = this;
	    this.X.InternAtom(false, '_NET_WM_CM_S' + screenNo, function(err, composite_atom) {
	        if (err) return cb(err);
	        self.X.SetSelectionOwner(wid, composite_atom, cb);
	    });
	}

	set_window_manager_owner(wid, name, _class, cb) {
	    var self = this;
	    async.parallel([
	        function(cb) {
	            self._change_property(self.root, '_NET_SUPPORTING_WM_CHECK', self.X.atoms.WINDOW, 32, [ wid ], cb);
	        }, function(cb) {
	            self._change_property(wid, '_NET_SUPPORTING_WM_CHECK', self.X.atoms.WINDOW, 32, [ wid ], cb);
	        }, function(cb) {
	            self.set_pid(wid, cb);
	        }, function(cb) {
	            self.set_name(wid, name, cb);
	        }, function(cb) {
	            self.set_class(wid, _class, cb);
	        }
	    ], cb);
	}

	close_window(wid, delete_protocol) {
	    if (delete_protocol) {
	        this.send_client_message(wid,
	                                 this.X.atoms.WM_PROTOCOLS,
	                                 this.X.atoms.WM_DELETE_WINDOW);
	    } else {
	        this.X.KillClient(wid);
	    }
	}

	send_client_message(dest, type, data) {
	    var raw = new Buffer(new Array(32));
	    raw.writeInt8(33, 0); /* ClientMessage code */
	    if (type === this.X.atoms.WM_PROTOCOLS) {
	        raw.writeInt8(32, 1); /* Format */
	        raw.writeUInt32LE(dest, 4);
	        raw.writeUInt32LE(type, 8); /* Message Type */
	        raw.writeUInt32LE(data, 12); /* For WM_PROTOCOLS data === Protocol */
	    }

	    this.X.SendEvent(dest, false, 0, raw);
	}

	_handle_event(ev) {
	    var self = this;
	    switch(ev.name) {
	        case 'ClientMessage':
	            this.X.GetAtomName(ev.type, function(err, name) {
	                switch (name) {
	                    case '_NET_ACTIVE_WINDOW':
	                        self.emit('ActiveWindow', ev.wid);
	                    break;

	                    case '_NET_CLOSE_WINDOW':
	                        self.emit('CloseWindow', ev.wid);
	                    break;

	                    case '_NET_CURRENT_DESKTOP':
	                        self.emit('CurrentDesktop', ev.data[0]);
	                    break;

	                    case '_NET_WM_DESKTOP':
	                        self.emit('Desktop', ev.wid, ev.data[0]);
	                    break;
	                }
	            });
	        break;
	    }
	}

	_change_property(wid, property, type, format, data, cb) {
	    set_property(this.X, wid, property, type, format, data, cb);
	}

	_update_window_list(list, prop, cb) {
	    this._change_property(this.root, prop, this.X.atoms.WINDOW, 32, list, cb);
	}
}

util.inherits(EWMH, EventEmitter);
