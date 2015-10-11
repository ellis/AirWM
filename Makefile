.PHONY: run run2

runold:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 node lib/index.js &

init:
	killall Xephyr || true
	Xephyr :1 -ac -screen 1024x800 &
	sleep 1
	DISPLAY=:1 xterm &
	DISPLAY=:1 xterm &
	DISPLAY=:1 xclock &
	DISPLAY=:1 lxqt-panel &
	#sleep 1
	DISPLAY=:1 ./node_modules/.bin/babel-node src/wm.js

testing:
	killall Xephyr || true
	Xephyr :1 -ac -screen 800x600 &
	sleep 0.5
	#DISPLAY=:1 xterm &
	DISPLAY=:1 gnome-terminal &
	#DISPLAY=:1 xfce4-panel &
	#DISPLAY=:1 lxqt-panel &
	#	sleep 1
	DISPLAY=:1 ./node_modules/.bin/babel-node src/wm.js


restart:
	DISPLAY=:1 ./node_modules/.bin/babel-node src/wm.js

examplewm:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 node ./node_modules/x11/examples/windowmanager/wm.js &

kill:
	killall Xephyr
