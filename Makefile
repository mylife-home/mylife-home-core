BIN         = ./node_modules/.bin
MOCHA       = $(BIN)/mocha
JSHINT      = $(BIN)/jshint
NODE        = node
MOCHA_OPTS  = --timeout 2000 --recursive -b
REPORTER    = spec
TEST_FILES  = test

lint:
	$(JSHINT) lib/* test/*

test: lint
	$(MOCHA) $(MOCHA_OPTS) --reporter $(REPORTER) $(TEST_FILES)

test-silent:
	$(MOCHA) $(MOCHA_OPTS) -b --reporter dot $(TEST_FILES)

start:
	$(NODE) bin/server.js

mod-clear:
	@ $(NODE) bin/modules.js clear

mod-link:
	@ $(NODE) bin/modules.js link ${MODULE}

mod-unlink:
	@ $(NODE) bin/modules.js unlink ${MODULE}