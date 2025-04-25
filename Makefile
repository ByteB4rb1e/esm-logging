NPM=npm

.PHONY: configure chore build dist test publish doc

all: chore

chore: configure

configure:
	autoconf

build:
	$(NPM) run build

test:
	$(NPM) run test

doc:
	$(NPM) run doc

dist:
	$(NPM) run dist

publish:
	$(NPM) run mypublish -- -r '$(NPM_REGISTRY)'

clean:
	rm -rvf configure~ config.log config.status autom4te.cache build dist
