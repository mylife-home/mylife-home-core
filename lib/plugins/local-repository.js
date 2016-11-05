'use strict';

const path          = require('path');
const fs            = require('fs');
const child_process = require('child_process');
const del           = require('del');
const ModuleInfo    = require('./module-info');
const PluginInfo    = require('./plugin-info');
const metadata      = require('../metadata');

// TODO: use same as remote-repository.js
const user          = 'vincent-tr';
const repoPrefix    = 'mylife-home-core-plugins-';
const rootDirectory = path.resolve(__dirname, '../..');

function toUnderscore(name) {
  const parts = name.split(/(?=[A-Z])/);
  return parts.map(p => p.toLowerCase()).join('_');
}

module.exports = class LocalRepository {

  constructor() {
    const dir = path.resolve(path.join(__dirname, '../../data'));
    this._dataFileName = path.join(dir, 'modules.json');

    try {
     fs.accessSync(dir, fs.R_OK | fs.W_OK);
    } catch(err) {
      fs.mkdirSync(dir, 0o755);
    }

    let metadata = [];
    try {
      metadata = JSON.parse(fs.readFileSync(this._dataFileName, 'utf8'));
    } catch(err) {
      // consider the file does not exist
    }

    this._modules = new Map();
    for(let item of metadata) {
      this._loadModule(item);
    }
  }

  install(moduleMetadata, done) {
    // npm install github:vincent-tr/mylife-home-core#5d638ce8a81c775610bb8f22177de95ca51c17ed
    const url = `github:${user}/${repoPrefix}${moduleMetadata.name}#${moduleMetadata.commit}`;
    return child_process.exec('npm install -O' + url, {
      cwd: rootDirectory
    }, (error/*, stdout, stderr*/) => {
      if(error) { return done(error); }
      this._loadModule(moduleMetadata);
      this._saveMetadata();
      return done();
    });
  }

  _loadModule(metadata) {
    const moduleEntry = require(repoPrefix + metadata.name);
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

  _saveMetadata() {
    const content = this.list().map((mi) => ({
      name        : mi.name,
      description : mi.description,
      commit      : mi.commit,
      date        : mi.date
    }));
    fs.writeFileSync(this._dataFileName, JSON.stringify(content, null, 2), { mode : 0o644 });
  }

  list() {
    return Array.from(this._modules.values());
  }

  uninstall(moduleName) {
    if(!this._modules.get(moduleName)) {
      throw new Error('not found');
    }

    // delete metadata
    this._modules.delete(moduleName);
    this._saveMetadata();

    // unload/delete module
    const nodeModuleName = repoPrefix + moduleName;
    const rootPath = path.join(rootDirectory, 'node_modules', nodeModuleName);
    const moduleId = require.resolve(nodeModuleName);
    this._unloadModule(rootPath, moduleId);
    this._unloadChild(moduleId);
    del.sync(rootPath);
  }

  _unloadChild(id) {
    // remove from our self children as we loaded it
    const index = module.children.findIndex((mod) => mod.id === id);
    if(index === -1) { return; } // paranoia
    module.children.splice(index, 1);
  }

  _unloadModule(rootPath, id) {
    const module = require.cache[id];
    if(!module) { return; }
    delete require.cache[id];
    const boundUnload = this._unloadModule.bind(this, rootPath);
    module.children.
      map((mod) => mod.id).
      // Uninstall only depencencies related to this module
      filter((modId) => modId.startsWith(rootPath)).
      forEach(boundUnload);
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
