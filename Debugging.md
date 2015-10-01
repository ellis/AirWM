# Debug the X11 protocol stream

Communication with X11 takes place via a protocol.
It may be necessary to inspect the stream, for which `xtrace` is very helpful.
To use this, open three terminals:

Terminal 1: ``Xephyr :1 -ac -screen 800x600``

Terminal 2: ``xtrace -n -D:2 -d:1 -o xtrace.log``

Terminal 3: ``DISPLAY=:2 ./node_modules/.bin/babel-node src/seawm.js``

This can also be used with other WMs so see what they are sending to the X11 server.
