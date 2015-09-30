.PHONY: run run2

run:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 node lib/index.js &

run2:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 ./node_modules/.bin/babel-node src/seawm.js &

miniwm1:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 ./node_modules/.bin/babel-node src/miniwm1.js &

examplewm:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 node ./node_modules/x11/examples/windowmanager/wm.js &

kill:
	killall Xephyr
