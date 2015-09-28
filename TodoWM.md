* [x] maximize the "Desktop" type window
* [ ] automatically make space for `_NET_WM_WINDOW_TYPE_DOCK`, such as lxqt-panel
* [ ] restructure classes so that there is one Screen for each screen and a separate list of workspaces
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

* Allow for some simple dynamic layouts: tiled (right or down), grid, stacked, tabbed
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
