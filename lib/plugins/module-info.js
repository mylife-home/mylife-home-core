'use strict';

module.exports = class ModuleInfo {
  constructor(plugins) {
    this._plugins = plugins;
  }

  get plugins() { return this._plugins; }
};
