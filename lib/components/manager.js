'use strict';

const path      = require('path');
const fs        = require('fs');
const async     = require('async');
const Component = require('./component');

module.exports = class Manager {
  constructor(netConfig, localPluginManager) {
    this._netConfig = netConfig;
    this._localPluginManager = localPluginManager;
    this._components = new Map();

    this._dataFileName = path.resolve(path.join(__dirname, '../../data/components.json'));

    let content = [];
    try {
      content = JSON.parse(fs.readFileSync(this._dataFileName, 'utf8'));
    } catch(err) {
      // consider the file does not exist
    }

    for(let comp of content) {
      this.create(comp.module, comp.plugin, comp.id, comp.config, comp.designer, comp.bindings, true);
    }
  }

  _deleter(comp) {
    return (cb) => this.delete(comp, cb, true);
  }

  close(done) {
    const array = Array.from(this._components.keys()).map((comp) => this._deleter(comp));
    async.parallel(array, done);
  }

  list() {
    return Array.from(this._components.values());
  }

  create(moduleName, pluginName, id, config, designer, bindings, skipSave) {
    const comp = this._components.get(id);
    if(comp) { throw new Error('component already exists'); }
    const pluginInfo = this._localPluginManager.lookup(moduleName, pluginName);
    this._components.set(id, new Component(id, designer, pluginInfo, config, this._netConfig, bindings));

    if(!skipSave) {
      this._save();
    }
  }

  setDesigner(id, designer) {
    const comp = this._components.get(id);
    if(!comp) { throw new Error('component does not exist'); }
    comp.designerData = designer;

    this._save();
  }

  delete(id, done, skipSave) {
    const comp = this._components.get(id);
    if(!comp) { return setImmediate(done, 'component does not exist'); }
    this._components.delete(id);
    comp.close(done);

    if(!skipSave) {
      this._save();
    }
  }

  bind(id, action, remoteId, remoteAttribute) {
    const comp = this._components.get(id);
    if(!comp) { throw new Error('component does not exist'); }
    comp.bind(action, remoteId, remoteAttribute);

    this._save();
  }

  unbind(id, action, remoteId, remoteAttribute) {
    const comp = this._components.get(id);
    if(!comp) { throw new Error('component does not exist'); }
    comp.unbind(action, remoteId, remoteAttribute);

    this._save();
  }

  _save() {
    const content = this.list().map((comp) => ({
      id       : comp.id,
      module   : comp.pluginInfo.module,
      plugin   : comp.pluginInfo.name,
      config   : comp.pluginConfig,
      designer : comp.designerData,
      bindings : comp.bindingsData
    }));
    fs.writeFileSync(this._dataFileName, JSON.stringify(content, null, 2), { mode : 0o644 });
  }
};
