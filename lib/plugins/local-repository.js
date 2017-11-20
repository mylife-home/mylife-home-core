'use strict';

/*
folder layout:

- root
 - plugins
  - plugin-a
   - module.json
   - commit-ish (with content of npm package)
*/

const os            = require('os');
const path          = require('path');
const child_process = require('child_process');
const fs            = require('fs-extra');
const common        = require('mylife-home-common');
const ModuleInfo    = require('./module-info');
const PluginInfo    = require('./plugin-info');
const metadata      = require('../metadata');

// TODO: use same as remote-repository.js
const user             = 'mylife-home';
const repoPrefix       = 'mylife-home-core-plugins-';
const rootDirectory    = path.resolve(__dirname, '../..');
const modulesDirectory = path.join(rootDirectory, 'plugins');

function toUnderscore(name) {
  const parts = name.split(/(?=[A-Z])/);
  return parts.map(p => p.toLowerCase()).join('_');
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file, content) {
  fs.writeFileSync(file, JSON.stringify(content, null, 2), { mode : 0o644 });
}

async function npmInstall(directory, module) {
  // npm i --global-style --production --no-optional --no-save --no-package-lock github:mylife-home/mylife-home-core-plugins-hw-absoluta
  return await common.utils.promise.fromCallback(done => child_process.exec(`npm i --global-style --production --no-optional --no-save --no-package-lock ${module}`, {
    cwd: directory
  }, (err/*, stdout, stderr*/) => done(err)))();
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
    if(!fs.existsSync(modulesDirectory)) {
      fs.mkdirSync(modulesDirectory, 0o755);
    }

    const moduleNames = fs.readdirSync(modulesDirectory);

    this._modules = new Map();
    for(const moduleName of moduleNames) {
      const moduleMetadata = loadJson(path.join(modulesDirectory, moduleName, 'module.json'));
      this._loadModule(moduleMetadata);
    }
  }

  install(moduleMetadata, done) {
    return common.utils.promise.synchronize(async () => {

      const tempDirectory = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
      const url = `github:${user}/${repoPrefix}${moduleMetadata.name}#${moduleMetadata.commit}`;

      try {
        await npmInstall(tempDirectory, url);
      } catch(err) {
        await fs.remove(tempDirectory);
        throw err;
      }

      const moduleDirectory = path.join(modulesDirectory, moduleMetadata.name);
      const commitDirectory = path.join(moduleDirectory, moduleMetadata.commit);

      if(!await fs.exists(moduleDirectory)) {
        await fs.mkdir(moduleDirectory, 0o755);
      }

      // remove if already installed (because it might be the result of a failure if we are re-installing)
      if(await fs.exists(commitDirectory)) {
        await fs.remove(commitDirectory);
      }

      await fs.move(path.join(tempDirectory, 'node_modules', repoPrefix + moduleMetadata.name), commitDirectory);
      await fs.remove(tempDirectory);

      // create module.json
      saveJson(path.join(moduleDirectory, 'module.json'), moduleMetadata);

      this._loadModule(moduleMetadata);

    }, done);
  }

  uninstall(moduleName, done) {
    const moduleMetadata = this._modules.get(moduleName);
    if(!moduleMetadata) {
      throw new Error('not found');
    }

    this._unloadModule(moduleMetadata);

    const moduleDirectory = path.join(modulesDirectory, moduleMetadata.name);
    fs.remove(moduleDirectory, done);
  }

  _loadModule(metadata) {
    const moduleEntry = require(path.join(modulesDirectory, metadata.name, metadata.commit));
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
    const moduleDirectory = path.join(modulesDirectory, metadata.name);
    const ids = Object.keys(require.cache).filter(id => id.startsWith(modulesDirectory));
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
