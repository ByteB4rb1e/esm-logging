NPM=npm

.PHONY: configure chore package-lock.json publish dist

all: dist

tags:
	ctags -R --exclude=node_modules --exclude=vendor --exclude=docs \
	--exclude=*.js --exclude=*.htm* --exclude=*.json --exclude=src/style

chore: configure package-lock.json

configure:
	autoconf

build/release/: node_modules/ src/ tsconfig.json
	$(NPM) run build:release

build/debug/: node_modules/ src/ tsconfig.debug.json
	$(NPM) run build:debug

build/doc/: node_modules/ src/ typedoc.json tsconfig.json
	$(NPM) run doc

test-reports/: node_modules/ tests/ src/ jest.config.mjs
	$(NPM) run test

dist: build/release/ build/doc/
	$(NPM) run dist -- build/doc/

publish: node_modules/ tsconfig.node.json
	$(NPM) run publish_ -- -r '$(NPM_REGISTRY)'

# necessary when using a local npm mirror/proxy
package-lock.json: package.json
	rm -rf package-lock.json
	npm install --registry=https://registry.npmjs.org

clean:
	rm -rvf configure~ config.log config.status autom4te.cache build dist
