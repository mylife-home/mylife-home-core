'use strict';

// hw_exec.shell (version: Tue Jul 14 17:16:26 2015) : usage=driver, class=.action, config=s:command

module.exports = class PluginInfo {
  constructor(name, metadata, factory) {
    this._name = name;
    this._metadata = metadata;
    this._factory = factory;
  }

  get name() { return this._name; }
  get metadata() { return this._metadata; }
  get factory() { return this._factory; }
};
