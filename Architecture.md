At the top of the hierarchy are Screens, one for each physical screen.
A screen is a Container.
Each screen is assigned a unique Workspace.
A Container has children, which may be Windows or other Containers.
A Window has a type.
A "BACKGROUND" window fills the container and is at the bottom of the window stack;
there can only be one background window per container.
A "DOCK" window ...

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
