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

    const dir = path.resolve(path.join(__dirname, '../../data'));
    this._dataFileName = path.join(dir, 'components.json');

    try {
     fs.accessSync(dir, fs.R_OK | fs.W_OK);
    } catch(err) {
      fs.mkdirSync(dir, 0o755);
    }

    let content = [];
    try {
      content = JSON.parse(fs.readFileSync(this._dataFileName, 'utf8'));
    } catch(err) {
      // consider the file does not exist
    }

    for(let comp of content) {
      this._loadFromSaveData(comp);
    }
  }

  _loadFromSaveData(item) {
    this.create(item.module, item.plugin, item.id, item.config, item.designer, item.bindings, true);
  }

  _getSaveData(comp) {
    return {
      id       : comp.id,
      module   : comp.pluginInfo.module,
      plugin   : comp.pluginInfo.name,
      config   : comp.pluginConfig,
      designer : comp.designerData,
      bindings : comp.bindingsData
    };
  }

  _save() {
    const content = this.list().map((comp) => this._getSaveData(comp));
    fs.writeFileSync(this._dataFileName, JSON.stringify(content, null, 2), { mode : 0o644 });
  }

  _deleter(compId) {
    return (cb) => this.delete(compId, cb, true);
  }

  close(done) {
    const array = Array.from(this._components.keys()).map((compId) => this._deleter(compId));
    async.parallel(array, done);
  }

  list() {
    return Array.from(this._components.values());
  }

  get(id) {
    return this._components.get(id);
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
    if(!comp) { throw new Error(`component '${id}' does not exist`); }
    comp.designerData = designer;

    this._save();
  }

  delete(id, done, skipSave) {
    const comp = this._components.get(id);
    if(!comp) { return setImmediate(done, `component '${id}' does not exist`); }
    this._components.delete(id);
    comp.close(done);

    if(!skipSave) {
      this._save();
    }
  }

  bind(id, action, remoteId, remoteAttribute) {
    const comp = this._components.get(id);
    if(!comp) { throw new Error(`component '${id}' does not exist`); }
    comp.bind(action, remoteId, remoteAttribute);

    this._save();
  }

  unbind(id, action, remoteId, remoteAttribute) {
    const comp = this._components.get(id);
    if(!comp) { throw new Error(`component '${id}' does not exist`); }
    comp.unbind(action, remoteId, remoteAttribute);

    this._save();
  }

  unloadModules(moduleNames, done) {
    const data = [];
    const tasks = [];
    for(let comp of this.list()) {
      if(moduleNames.indexOf(comp.pluginInfo.module) < 0) { continue; }
      // save state to data and delete
      data.push(this._getSaveData(comp));
      tasks.push(this._deleter(comp.id));
    }
    async.parallel(tasks, (err) => {
      if(err) { return done(err); }
      done(undefined, data);
    });
  }

  reloadModules(data) {
    for(let item of data) {
      this._loadFromSaveData(item);
    }
  }
};
