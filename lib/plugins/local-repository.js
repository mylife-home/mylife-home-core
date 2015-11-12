'use strict';

const path          = require('path');
const fs            = require('fs');
const child_process = require('child_process');
const ModuleInfo    = require('./module-info');
const PluginInfo    = require('./plugin-info');
const metadata      = require('../metadata');

// TODO: use same as remote-repository.js
const user          = 'vincent-tr';
const repoPrefix    = 'mylife-home-core-plugins-';

function toUnderscore(name) {
  const parts = name.split(/(?=[A-Z])/);
  return parts.map(p => p.toLowerCase()).join('_');
}

module.exports = class LocalRepository {

  constructor() {
    this._dataFileName = path.resolve(path.join(__dirname, '../../data/modules.json'));

    let metadata = [];
    try {
      metadata = JSON.parse(fs.readFileSync(this._dataFileName, 'utf8'));
    } catch(err) {
      // consider the file does not exist
    }

    this._modules = {};
    for(let item of metadata) {
      this._loadModule(item);
    }
  }

  install(moduleMetadata, done) {
    // npm install github:vincent-tr/mylife-home-core#5d638ce8a81c775610bb8f22177de95ca51c17ed
    const url = `github:${user}/${repoPrefix}${moduleMetadata.name}#${moduleMetadata.commit}`;
    return child_process.exec('npm install ' + url, {
      cwd: path.resolve(__dirname, '../..')
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
      plugins.push(this._loadPlugin(name, pluginType));
    }
    this._modules[metadata.name] = new ModuleInfo(metadata, plugins);
  }

  _loadPlugin(name, PluginType) {
    return new PluginInfo(
      toUnderscore(name),
      metadata.Repository.get(PluginType),
      (config) => new PluginType(config));
  }

  _saveMetadata() {
    const content = Object.keys(this._modules).map((key) => {
      const mi = this._modules[key];
      return {
        name        : mi.name,
        description : mi.description,
        commit      : mi.commit,
        date        : mi.date
      };
    });
    fs.writeFileSync(this._dataFileName, JSON.stringify(content, null, 2), { mode : 0o644 });
  }

  list() {
    return Object.keys(this._modules).map((key) => this._modules[key]);
  }

  uninstall(/*moduleName, done*/) {
    // TODO ensure unused ?
    // TODO setup locally moduleinfo
    // TODO delete files
    // this._saveMetadata();
  }
};
