# State

At the top of the hierarchy are Screens, one for each physical screen.
A screen is a Container.
Each screen is assigned a unique Workspace.
A Container has children, which may be Windows or other Containers.
A Window has a type.
A "BACKGROUND" window fills the container and is at the bottom of the window stack;
there can only be one background window per container.
A "DOCK" window ...

```yaml
idNext: 0
containers:
  1:
    name: web
    children: [5]
    docks: []
    background: ID
    floats: []
    screen: 0
    focus: 5
    ...
screens:
  0:
    desktopCurrent: 1
panes:
  5:
    parent: 1
    xid: 0x141241512
screenCurrent: ID
paneCurrent: ID
```

* Screen
	* list of all workpaces
	* mru stack of workspace indexes
	* current workspace
	* background
	* docks
* Workspace (extends Container)
	* layout
* Container
	* parent
	* children
	* background
	* docks
	* floats
	* layout
* Frame
	* parent
	* xid (X11 window ID)
	* props (X11 window properties)

Screen
Workspace
Xwin (old: X11 Window)
Frame (old: Window)
Container
Layout
Frame

# Actions

* activateWindow
* activateDesktop
* activateScreen
* createDesktop
* createScreen
* createWidget
* destroyDesktop
* destroyWindow
* moveWindowToDesktop
* moveWindowToIndex
* moveWindowToScreen
* moveDesktopToScreen
* swapWindowIndexes
* swapDesktopIndexes
* hideWindow
* showWindow

Items can be selected by ID, index, name.
Destinations can be selected by ID, index, name, or stacking.

Possible ways to specify the selector:
* ID: `#`, e.g. `selector: "#1"`
* name: `""`, e.g. `selector: '"web"'`
* list index: number, e.g. `selector: 0` or `selector: "0"`
* relative list: `pn`, e.g. `selector: 'n'`
* relative desktop stack: `PN`
* relative session stack: `<>`? `PPNN`

# Keyboard shortcuts

Selecting keys is difficult to do well, because of the large degree of
freedom in selecting the memorable terms, and considerations of convenience during
real-life usage.

Here are some important terms we need and their various alternatives:

* create, add, insert, open, start, begin, new
* destroy, remove, delete, close, stop, end, dispose, trash
* activate, focus, goto, jump, open
* move, send, push
* hide, iconify, obscure, minimize

For naviation, we also need:
* next/prev (index, desktop stack, session stack)

For display:
* show/hide
* minimize/restore/maximize/full-screen
* toggling dock visibility
