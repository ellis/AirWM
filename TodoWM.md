* [x] maximize the "Desktop" type window
* [ ] automatically make space for `_NET_WM_WINDOW_TYPE_DOCK`, such as lxqt-panel
* [ ] supply list of windows to wmctrl (`_NET_CLIENT_LIST` or `_WIN_CLIENT_LIST`)
* [ ] put desktop on all workspaces
* [ ] refactor Workspace and Workspaces into ES6 classes
* [ ] refactor classes to put common functionality into bases classes
* [ ] Container: redraw functionality should be moved to Layout objects
* [ ] Window: the `move` and `moveFocus` functions should perhaps be moved to Container

Later:
* [ ] allow for different desktops on different workspaces
* [ ] figure out some form of 'show desktop' functionality

# Ideas

At the top of the hierarchy are Screens, one for each physical screen.
A screen is a Container.
Each screen is assigned a unique Workspace.
A Container has children, which may be Windows or other Containers.
A Window has a type.
A "BACKGROUND" window fills the container and is at the bottom of the window stack;
there can only be one background window per container.
A "DOCK" window ...

# Features I'd like

* Allow for some simple layouts: tiled (right or down), grid, stacked, tabbed
* Support a standard floating layout or layer
* Support manual layout
* Support dynamic layout
* Support spacing between windows
* Support docks and background windows on workspaces
* Figure out an advanced layout:
	* set the number of columns (normally 1 or 2, dynamic)
	* set the number of windows to show
	* support an "info" area for a window that's displayed in the most minor position, and can be toggled on/off
	* support toggling of dock windows
	*
* Configurable dashboard, calendar, todos, info about emails, weather, trains
* Allow for conveniently switching between activities:
	* 
