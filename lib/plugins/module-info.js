'use strict';

module.exports = class ModuleInfo {
  constructor(metadata, plugins) {
    this._name        = metadata.name;
    this._description = metadata.description;
    this._commit      = metadata.commit;
    this._date        = metadata.date;

    this._plugins = plugins;
  }

  get name() { return this._name; }
  get description() { return this._description; }
  get commit() { return this._commit; }
  get date() { return this._date; }
  get plugins() { return this._plugins; }
};
