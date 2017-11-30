'use strict';

const path             = require('path');
const common           = require('mylife-home-common');
const ModuleInfo       = require('./module-info');
const PluginInfo       = require('./plugin-info');
const metadata         = require('../metadata');
const ModuleRepository = require('./module-repository');

function toUnderscore(name) {
  const parts = name.split(/(?=[A-Z])/);
  return parts.map(p => p.toLowerCase()).join('_');
}

function unloadCachedModule(id) {
  const module = require.cache[id];

  // do not unload native modules
  if(path.extname(id) === '.node') {
    return;
  }

  delete require.cache[id];

  // remove relationships pointing to this module
  for(const itModule of Object.values(require.cache)) {
    if(itModule.parent === module) {
      itModule.parent = null;
    }

    const index = itModule.children.findIndex(child => child === module);
    if(index >= 0) {
      itModule.children.splice(index, 1);
    }
  }
}

module.exports = class LocalRepository {

  constructor() {
    this._moduleRepository = new ModuleRepository();
    this._busy             = false;
    this._modules          = new Map();
    this._moduleRepository.list().forEach(moduleMetadata => this._loadModule(moduleMetadata));
  }

  async _process(target) {
    if(this._busy) {
      throw new Error('Cannot execute install/uninstall task : another is already running');
    }
    try {
      this._busy = true;
      return await target();
    } finally {
      this._busy = false;
    }
  }

  install(moduleMetadata, done) {
    return common.utils.promise.synchronize(async () => this._process(async () => {

      await this._moduleRepository.install(moduleMetadata);
      this._loadModule(moduleMetadata);

    }), done);
  }

  uninstall(moduleName, done) {
    return common.utils.promise.synchronize(async () => this._process(async () => {

      const moduleMetadata = this._modules.get(moduleName);
      if(!moduleMetadata) {
        throw new Error('not found');
      }

      this._unloadModule(moduleMetadata);
      await this._moduleRepository.uninstall(moduleMetadata);
    }), done);
  }

  _loadModule(metadata) {
    const moduleEntry = require(this._moduleRepository.moduleEntry(metadata));
    const plugins = [];
    for(let name of Object.keys(moduleEntry)) {
      let pluginType = moduleEntry[name];
      plugins.push(this._loadPlugin(name, metadata.name, pluginType));
    }
    this._modules.set(metadata.name, new ModuleInfo(metadata, plugins));
  }

  _loadPlugin(name, moduleName, PluginType) {
    return new PluginInfo(
      toUnderscore(name),
      moduleName,
      metadata.Repository.get(PluginType),
      (config) => new PluginType(config));
  }

  _unloadModule(metadata) {
    this._modules.delete(metadata.name);

    // clean cache
    const moduleDirectory = this._moduleRepository.moduleDirectory(metadata);
    const ids = Object.keys(require.cache).filter(id => id.startsWith(moduleDirectory));
    ids.forEach(unloadCachedModule);
  }

  list() {
    return Array.from(this._modules.values());
  }

  lookup(moduleName, pluginName) {
    const module = this._modules.get(moduleName);
    if(!module) {
      throw new Error(`Module not found: '${moduleName}'`);
    }
    const plugin = module.plugins.find((p) => p.name === pluginName);
    if(!plugin) {
      throw new Error(`Plugin not found: '${pluginName}', in module: '${moduleName}'`);
    }
    return plugin;
  }
};
