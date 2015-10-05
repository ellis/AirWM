killall Xephyr || true
Xephyr :1 -ac -screen 1024x800 &
sleep 1
DISPLAY=:1 xterm &
DISPLAY=:1 xterm &
DISPLAY=:1 xclock &
DISPLAY=:1 lxqt-panel &
#sleep 1
DISPLAY=:1 ./node_modules/.bin/babel-node src/seawm.js
