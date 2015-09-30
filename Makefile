.PHONY: run run2

run:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 node lib/index.js &

run2:
	Xephyr :1 -ac -screen 800x600 &
	DISPLAY=:1 ./node_modules/.bin/babel-node src/seawm.js &

kill:
	killall Xephyr
