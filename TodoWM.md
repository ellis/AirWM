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
* [x] create "Tall" layout engine
* [x] actions: send window to desktop
* [x] rename actions
* [x] move old files with conflicting names (on MacOS) to another directory
* [x] windowOrder, windowStack, desktopOrder, desktopStack, screenOrder, screenStack
* [x] actions: move windows in childIds order
* [x] only have mouse follow cursor when the user moves the mouse
* [x] actions: close window
* [x] ewmh: get ewmh to work without blocking lots of window events
* [x] ewmh: set desktop count
* [x] ewmh: set current desktop
* [x] ewmh: `_NET_CLIENT_LIST`
* [x] ewmh: `_NET_CLIENT_LIST_STACKING`
* [x] ewmh: accept client messages
* [x] ewmh: handle desktop switching
* [x] ewmh: set window's desktop
* [x] ewmh: set WM_STATE to [Normal, None]
* [x] ewmh: get xfce and lxqt panels to recognize windows (see <https://github.com/lxde/lxqt/issues/354> and <https://github.com/herbstluftwm/herbstluftwm/commit/a50457335091cd990d0146e5008ca3b3db1cc574>)
* [x] BUG: `_NET_NUMBER_OF_DESKTOPS` should not be set multiple times
* [?] don't let user close docks or backgrounds (will need to have separate commands for when X tells us that a window is closed and when the user pressed Win-Shift-C)
* [x] check which client messages are sent from lxqt's task bar when clicking on a member of a program with multiple instances.
* [x] state.ewmh: set `_NET_WM_ALLOWED_ACTIONS` to `[_NET_WM_ACTION_CLOSE]` (except on docks and backgrounds)
* [x] clientMessage: `_NET_CLOSE_WINDOW`
* [x] better focus follows mouse
* [x] recognize and maximize the "Desktop" type window
* [ ] BUG: start firefox or atom (or any program?); switch to different desktop; quick WM; restart WM; the windows are no longer displayed
* [ ] BUG: start firefox; press Ctrl-N; the new window isn't sized properly
* [ ] activate window on mouse click
* [ ] state: add orphanId lists
* [ ] ewmh: set `_NET_WM_STATE` to empty by default
* [ ] implement more commandHandlers() as actions
* [ ] save state to console after every change, for debugging
* [ ] BUG: start two xterms; click 'xterm' on lxqt-panel's task bar then move mouse to one of the xterms; the popup is then drawn below the windows
* [ ] figure out how `--replace` flag works in xmonad so that I can use the WM in xfce
* [ ] state: add floatId lists
* [ ] Win-move to move floating windows (see <https://github.com/jichu4n/basic_wm>)
* [ ] ewmh: handle `_NET_WM_WINDOW_TYPE_DIALOG`, sometimes make it floating
* [ ] state: support hidden/iconified windows
	* [ ] clientMessage: handle WM_CHANGE_STATE
	* [ ] ewmh: `_NET_WM_STATE_HIDDEN`, `_NET_WM_STATE_FOCUSED`
* [ ] for better focus-follows-mouse, may need to use XInput extension, but it looks like the x11 package hasn't implemented that protocol yet

Naming:
* jetwm jetwm howmoo lowmo light flowm flowmo flowmotion

Testing:
* [ ] test `moveWindowToIndex`
* [ ] test 'desktop.raise' more thoroughly
* [ ] test multiple docks and different dock gravities
* [ ] test 'move' action
* [ ] test 'closeWindow' (perhaps put it in destroyWidgetSpec.js?)

Refactoring:
* [ ] consider switching from Immutable to <https://github.com/rtfeldman/seamless-immutable>
* [ ] maybe make StateWrapper, ScreenWrapper, and related classes to encapsulate related functions
* [ ] remove 'xid' from first element of 'x11' settings lists
* [ ] use 'activate' for 'focus.move*' => 'window.active*', and 'desktop.activate'
* [ ] handleStateChange: don't call DestroyWindow on a window that was already destroyed
* [ ] consider using `activeChildIndex` and `activeDesktopIndex` instead of IDs
* [ ] move `x11.wmSettings` to `x11.windowsSettings[xidRoot]`

Later:
* [ ] when a new window is created that is associated with another window, insert is after that window in the stack, rather than at the end of the stack
* [ ] x11: set sibling and stackMode properly for windows
* [ ] figure out why task switching using lxqt-panel doesn't work well (it sends messages to iconify the windows)
* [ ] ewmh: handle `_NET_WM_WINDOW_TYPE_NOTIFICATION`
* [ ] ewmh: handle `_NET_WM_STATE_STICKY`
* [ ] implement command language and selector parameters
* [ ] ewmh: docks should also be listed in windows
* [ ] config: allow for loading a js file instead of just JSON
* [ ] config: add desktop config, accept a number, a list of strings, or JSON widget objects
* [ ] detect existing X11 tree on startup and add windows
* [ ] widget.add: maybe add 'desktopNum' parameter?
* [ ] allow for different desktops on different workspaces
* [ ] figure out some form of 'show desktop' functionality
* [ ] check out features at <http://awesome.naquadah.org/>
* [ ] consider <https://github.com/anko/hudkit> for decorations
* [ ] consider <https://github.com/anko/basedwm> for socket interface
* [ ] look into using 'async', perhaps look at x11-props code
* [ ] cli command interface
* [ ] HUD/UI command interface
* [ ] option to add titlebar and frame to windows, especially floating windows (see `x11/examples/windowmanager/wm.js`)
* [ ] read this to make sure I've got stacking order right: <https://smspillaz.wordpress.com/2011/09/18/braindump-how-to-get-window-stacking-right/>

Multi-screen todos:
* [ ] test showing a dock on each screen
* [ ] allow for dynamic plugging in of a screen

# Notes

* <http://seasonofcode.com/posts/how-x-window-managers-work-and-how-to-write-one-part-i.html>
* <http://teropa.info/blog/2015/09/10/full-stack-redux-tutorial.html>
* for a python WM with some EWMH support: <https://github.com/qtile/qtile/blob/02fd471f3a3b9becd148709879c3569647d45325/libqtile/xcbq.py>

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

# Grammar

Perhaps start via Win-Period.

(or use asdf: activate, send, destroy, flip)
(or for activate: go, focus, jump)

* `m[w][i]1`: move current window to position 1
* `m[w][i]$`: move current window to last position
* `m[w][i]n`: move current window to next position among siblings
* `m[w]d2`: move current window to desktop 2 (insert at front of children)
* `m[w]dn`: move current window to next desktop
* `m[w]d2!`: move current window to desktop 2, but don't follow it
* `m[w]1d2i3`: move window 1 (on current desktop) to desktop 2 at index 3
* `md1w1d2i3`: move desktop 1's window 1 to desktop 2 at index 3
* `md1s2`: move desktop 1 to screen 2
* `mdsn`: move desktop to next screen
* `s[w]1i4` or `s1,4`: swap positions of windows 1 and 4
* `a[w]1`: activate window 1 (on current desktop)
* `ad2`: activate desktop 2
* `as2`: activate screen 2
* `an` or `a[w]n`: activate next window?
* need to figure out next/prev by index or stack order, and stack order for current desktop or over whole session: n, N, NN ?
* `m[w]1+2d2$!`: send windows 1 and 2 to desktop 2, append to end of children
* close (c, x?), new, duplicate?

Other commands, perhaps pull up command list with Win-Shift-Period.

* lock
* logout
* shutdown
