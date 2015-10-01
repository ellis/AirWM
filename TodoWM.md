# Todos

* [x] move X11 window info to core
* [x] move 'desktopNum' to updateX11
* [x] handle X11 focus changes
* [x] catch state changes so that new windows are displayed
* [x] handle Win-K
* [x] when window is closed, remove it from layout
* [x] allow for passing keyboard bindings to store.dispatch()
* [x] automatically make space for `_NET_WM_WINDOW_TYPE_DOCK`, such as lxqt-panel
* [x] core: desktop.raise
* [?] switch desktops with Win-1..9
* [ ] create "Tall" layout engine
* [ ] actions: send window to desktop
* [ ] actions: close window
* [ ] actions: move windows in childIds order
* [ ] ewmh: get ewmh to work without blocking lots of window events
* [ ] ewmh: desktop count
* [ ] ewmh: desktop switching
* [ ] ewmh: `_NET_CLIENT_LIST`
* [ ] ewmh: `_NET_CLIENT_LIST_STACKING`
* [ ] ewmh: get xfce and lxqt panels to recognize windows
* [ ] implement more commandHandlers() as actions
* [ ] recognize and maximize the "Desktop" type window
* [ ] save state to console after every change, for debugging
* [ ] only have mouse follow cursor when the user moves the mouse

Testing:
* [ ] test 'desktop.raise' more thoroughly
* [ ] test multiple docks and different dock gravities

Refactoring:
* [ ] remove 'xid' from first element of 'x11' settings lists
* [ ] use 'activate' for 'focus.move*' => 'window.active*', and 'desktop.activate'
* [ ] handleStateChange: don't call DestroyWindow on a window that was already destroyed

Later:
* [ ] config: allow for loading a js file instead of just JSON
* [ ] config: add desktop config, accept a number, a list of strings, or JSON widget objects
* [ ] widget.add: maybe add 'desktopNum' parameter?
* [ ] allow for different desktops on different workspaces
* [ ] figure out some form of 'show desktop' functionality
* [ ] check out features at <http://awesome.naquadah.org/>
* [ ] consider <https://github.com/anko/hudkit> for decorations
* [ ] consider <https://github.com/anko/basedwm> for socket interface
* [ ] look into using 'async', perhaps look at x11-props code
* [ ] cli command interface
* [ ] HUD command interface

Multi-screen todos:
* [ ] test showing a dock on each screen
* [ ] allow for dynamic plugging in of a screen

# Notes

* <http://seasonofcode.com/posts/how-x-window-managers-work-and-how-to-write-one-part-i.html>
* <http://teropa.info/blog/2015/09/10/full-stack-redux-tutorial.html>

# Features I'd like

* Allow for some simple dynamic layouts: tiled (right or down), grid, stacked, tabbed, full screen
* Support a traditional floating layout or layer
* Support manual layout
* Support dynamic layout
* Support spacing between windows
* Support docks and background windows on workspaces
* Docks can also be in overlay mode, where they're on top of programs, and don't use space
* Advanced Grid layout:
	* allow a frame to span multiple columns and rows
* Figure out an advanced dynamic layout:
	* set the number of columns (normally 1 or 2, dynamic)
	* set the number of windows to show
	* the last window can be toggled to have tabs for all non-displayed windows
	* support an "info" area for a window that's displayed in the most minor position, and can be toggled on/off
* Figure out an advanced manual layout:
	* allow for manual docking like in eclipse
	* the "main" area in the center can be manually split up
	* each "main" frame has a dynamic tabbed layout by default, but others could be chosen
* Configurable dashboard, calendar, todos, info about emails, weather, trains
* Allow for conveniently switching between activities:
	* each activity has a workspace configuration with the programs that were running
	* autosave the configuration
	* also allow for a standard configuration which can be reverted to
	* support closing all programs in the activity
	* support automatically starting all the programs in the activity
	* support switching activities by stopping the old programs and starting new ones
* Allow for restoring workspaces, layouts, frames, and windows
* Drag-n-drop frames: depending on where the frame is dropped, swap, insert above, create tab, create a new row/col, create a dock
