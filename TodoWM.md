# Todos

* [x] StateWrapper: moveWindowToIndexNext/Prev
* [x] StateWrapper: activateWindowNext/Prev (Win-J)
* [x] StateWrapper: layout
* [x] StateWrapper: x11
* [x] reducer.js: switch to using StateWrapper
* [x] seawm.js: switch to using StateWrapper
* [x] BUG: dock needs to take up window space
* [x] troubleshoot the exisiting shortcut actions
* [x] save state to console after every change, for debugging
* [-] BUG: start firefox; press Ctrl-N; the new window isn't sized properly
* [x] display xfce's panel on top
* [x] BUG: click on time in xfce panel twice: a bad window is left over
* [x] start xfce session and get xprop on xterm and calendar
* [x] big issue: need to process events in order, because two MapRequest events are coming in before we can notice for the second one that the window has already been created.
* [x] BUG: in gnome-terminal, press Ctrl+Shift+F or goto Help: why is the window sized incorrectly?
* [x] in gnome-terminal, open Edit|Preferences: the dialog should placed immediately after gnome-terminal and focused, because it has 'WM_TRANSIENT_FOR' set.
* [x] get `npm test` to run again by removing old test files
* [x] rename 'test' folder to 'tests'
* [x] test adding transient windows (both when the reference has focus and when not)
* [x] remove old code files
* [x] handle floating windows
	* [x] pull floating windows out of usual layout
	* [x] create shortcut to toggle floating (Win-P)
	* [x] give floating windows a different border
	* [x] update window stack intelligently
	* [x] in updateX11, set the siblings according to the desktop stack
	* [x] in updateX11, set the EWMH window stack appropriately
	* [x] BUG: floating window is displayed on all desktops
	* [x] BUG: `make init`, move mouse to bottom of clock, Win-P: why is window hidden?
	* [x] BUG: floating window not being covered by active window underneath
	* [x] for my Xephyr window, it looks like I can't grab Win+Button1, but need to use Win+Ctrl+Button1
	* [x] Win+(Ctrl+)leftclick to move floating windows (see <https://github.com/jichu4n/basic_wm>)
	* [x] Win-rightclick to resize floating windows
* [x] StateWrapper: rename `widgets.*.state` to `widgets.*.flags`
* [x] floating windows should always be in front of managed windows
* [x] BUG: `make testing`; open gvim's file dialog; open file: shouldn't crash
	* I think I might be mis-handling UnmapNotify, where the window gets removed, which leads to the window also being destroyed in handleStateChange()
	* I should only destroy windows when explicitly commanded by the user
	* This will require some extra state properties
	* When DestroyNotify is received, make sure the window is removed if still present
	* When UnmapNotify is received, call removeWindow(), which should maybe add some new state to x11 to unset some ewmh properties
	* when action closeWindow is received, should add some new state to x11 to destroy the window (the window will then be removed from x11 state by some dispatch from the DestroyNotify handler)
	* [x] rename `addWindow` to `attachWindow`
	* [x] create a `detachWindow` action (for no longer managing a window)
	* [x] dispatch `detachWindow` from UnmapNotify event
	* [x] `detachWindow`: make sure window is no longer in windowIdStack
	* [x] handleStateChange(): dispatch `removeWindow` for `flags.detaching` windows
	* [x] use `removeWindow` action for really removing it from the state
	* [x] write test for `detachWindow` -- it's not working properly with `make init`
* [x] rewrite closeWindow approach
	* [x] a `closeWindow` action should set `flags.closing` or `flags.requestClose`
	* [x] updateX11: windows with `flags.closing`: add property to call `global.X.DestroyWindow(xid)`
	* [x] updateX11: windows with `flags.requestClose`: add property to send ClientMessage to close
	* [x] handleStateChange: windows with `flags.closing`: either call `global.X.DestroyWindow(xid)`, or send ClientMessage to close
	* [x] handleStateChange: once ClientMessage to request close is sent, need to update state to delete `flags.requestClose`.
* [x] handle dialog boxes
	* [x] `_NET_WM_STATE(ATOM) = _NET_WM_STATE_MODAL`
	* [x] `_NET_WM_WINDOW_TYPE(ATOM) = _NET_WM_WINDOW_TYPE_DIALOG`
	* [x] cache old ConfigureWindow requests until DestroyNotify is received
	* [x] set requested coordinates from X11 events/messages/attributes
	* [x] ignore request for x=0, y=0
	* [x] x11: modal dialog boxes should be automatically positioned over their app window
	* [x] in gvim, goto File|Open: the dialog should float over it's transient-for window
* [x] BUG: `make init`, start gvim, type some text, close the window, confirm close: there are errors printed on the console
* [x] change border color for windows with modal dialogs open
* [x] BUG: EnterNotify doesn't always activate the entered window
* [ ] figure out how `--replace` flag works in xmonad so that I can use the WM in xfce (see Main.hs:replace)

* [ ] remove unused AirWM files, reorganize AirWM files I still need
* [ ] create a new repository (flowmo)
* [ ] activate window on mouse click
* [ ] allow for custom handling of specific EWMH flags?
* [ ] ewmh: set `_NET_WM_STATE` to empty by default
* [ ] state: support hidden/iconified windows
	* [ ] clientMessage: handle WM_CHANGE_STATE
	* [ ] ewmh: `_NET_WM_STATE_HIDDEN`, `_NET_WM_STATE_FOCUSED`
	* [ ] set `WM_STATE` to iconified for all non-visible windows (e.g. on hidden desktops)
* [ ] properly set X11 sibling above/below relationships
* [ ] StateWrapper: activateWindowBefore/After (on desktop) (Win-N)
* [ ] StateWrapper: activateWindowEarlier/Later (in session) (Win-Tab)
* [ ] StateWrapper: activateDesktopNext/Prev
* [ ] StateWrapper: activateDesktopEarlier/Later (in session)
* [ ] StateWrapper: add properties and handlers for mouse pointer to manage things like focus and dragging
* [ ] StateWrapper: add dragging properties and handlers
* [ ] BUG: start two xterms; click 'xterm' on lxqt-panel's task bar then move mouse to one of the xterms; the popup is then drawn below the windows -- might need to avoid setting 'stackMode:0,sibling:undefined' so as to avoid making any window absolutely top-most.
* [ ] xfce4-panel: the bottom panel should be centered
* [ ] updateX11: update window info for non-visible windows too, where possible
* [ ] should probably set the mouse icon explicitly, because otherwise the mouse might not be visible (like when we only start gvim in Xephyr)
* [ ] for better focus-follows-mouse: detect layout changes and use a timer to limit duration that EnterNotify is ignored.
* [ ] delete ewmh.js
* [ ] remove from package.json: node-ewmh, async
* [ ] handle window hints for sizes, especially for floating windows
* [ ] in gvim, goto File|Open: shouldn't be allowed to put focus back on the gvim window because of the MODAL dialog (but this is a bit complex: where to put focus if modal dialog is on a different screen?  Also need to take care in handling activate window next/prev)

Naming:
* jetwm jetzwm lowmo lightwm flowm flowmo flowmotion dashwm

Testing:
* [ ] test floating windows
	* [ ] test that transientForId and transientIdOrder are kept in sync
* [ ] test that modal dialogs are place in the middle over their parent window
* [ ] test window stacking
* [ ] test `moveWindowToIndex`
* [ ] test `setWindowRequestedProperties`
* [ ] test multiple docks and different dock gravities (still need to test left and right docks)
* [ ] write test for `closeWindow`

Refactoring:
* [ ] consider switching from Immutable to <https://github.com/rtfeldman/seamless-immutable>
* [ ] maybe make StateWrapper, ScreenWrapper, and related classes to encapsulate related functions
* [ ] remove 'xid' from first element of 'x11' settings lists
* [ ] use 'activate' for 'focus.move*' => 'window.active*', and 'desktop.activate'
* [ ] handleStateChange: don't call DestroyWindow on a window that was already destroyed
* [ ] consider using `activeChildIndex` and `activeDesktopIndex` instead of IDs
* [ ] move some stuff in `x11.wmSettings` to `x11.windowsSettings[xidRoot]`
* [ ] rename 'seawm.js' to 'wm.js'

Later:
* [ ] when a new window is created that is associated with another window, insert is after that window in the stack, rather than at the end of the stack
* [ ] x11: set sibling and stackMode properly for windows
* [ ] figure out why task switching using lxqt-panel doesn't work well (it sends messages to iconify the windows)
* [ ] ewmh: handle `_NET_WM_WINDOW_TYPE_NOTIFICATION`
* [ ] ewmh: handle `_NET_WM_STATE_STICKY`
* [ ] implement command language and selector parameters
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
* [ ] hot-reloading for updates to config?
* [ ] hot-reloading for changes to source files?
* [ ] look into compatibility with various pagers and launchers (e.g. dockbarx, docky, candybar, lemonbar)
* [ ] look into turning the WM into a compositing WM
	* <http://projects.mini-dweeb.org/attachments/download/3/report.pdf>
* [ ] for inspiration, lookup videos on Mac's Mission Control, Compiz F12, Ubuntu window management
* [ ] handle startup notification (<http://www.freedesktop.org/wiki/Software/startup-notification/> and <http://standards.freedesktop.org/startup-notification-spec/startup-notification-latest.txt>)
* [ ] maybe refactor so that every container (e.g. screen, desktop) also has a childIdStack, and then recursively build the window manager's childIdStack from those.
* [ ] at some point, rewrite the 'widgetIdNext' handling, and either just use the first available ID, or use the next available ID after the last created/removed window.

xfce todos:
* [ ] it'd be nice if the calendar popup weren't made into a managed window
	* look at ./temp/xprop-xfce-calendar-visible
	* consider `_NET_WM_STATE(ATOM) = _NET_WM_STATE_STICKY, _NET_WM_STATE_SKIP_PAGER, _NET_WM_STATE_SKIP_TASKBAR, _NET_WM_STATE_ABOVE, _NET_WM_STATE_FOCUSED`
	* consider `_NET_WM_WINDOW_TYPE(ATOM) = _NET_WM_WINDOW_TYPE_UTILITY`
* [ ] it'd be nice if clicking the application finder on the bottom panel multiple times didn't open multiple application finder windows
* [ ] after clicking on a window on the bottom panel, it'd be nice if the window got focus when it pops up (process `_NET_STARTUP_INFO_BEGIN` and `_NET_STARTUP_INFO`)


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
* `md1w1d`: move desktop 1's window 1 to the current desktop
* `md1w1d2i3`: move desktop 1's window 1 to desktop 2 at index 3
* `md1w1i`: move desktop 1's window 1 to the current desktop and current index
* `ms1wi`: move screen 1's current window to the current desktop and current index
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
* activate or open an application:
	* `ot`: activate most recent terminal window
	* `ot!`: open new terminal
	* `ov`: open vim
	* `o'firefox`: open firefox

Other commands, perhaps pull up command list with Win-Shift-Period.

* lock
* logout
* shutdown
