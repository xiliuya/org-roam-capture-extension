lib/turndown.js:
	cd turndown/;	npm run build
	cp turndown/dist/turndown.js ./lib/
lib/turndown-plugin-gfm.js:
	cd turndown-plugin-gfm/;	npm run build
	cp turndown-plugin-gfm/dist/turndown-plugin-gfm.js ./lib/
ext: lib/turndown.js lib/turndown-plugin-gfm.js
	web-ext build -i turndown/ turndown-plugin-gfm/ test/ Makefile
clean:
	-rm -f ./lib/*.js ./web-ext-artifacts/*
