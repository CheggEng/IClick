all:
	node build.js
	node ./node_modules/requirejs/bin/r.js -o config.js
	node ./node_modules/requirejs/bin/r.js -o config.min.js
	rm src/Combined.js
