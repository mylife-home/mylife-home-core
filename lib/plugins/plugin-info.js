'use strict';

// hw_exec.shell (version: Tue Jul 14 17:16:26 2015) : usage=driver, class=.action, config=s:command

module.exports = class PluginInfo {
  constructor(name, usage, clazz, config) {
    this._name = name;
    this._usage = usage;
    this._clazz = clazz;
    this._config = config;
  }

  get name() { return this._name; }
  get usage() { return this._usage; }
  get clazz() { return this._clazz; }
  get config() { return this._config; }

};
