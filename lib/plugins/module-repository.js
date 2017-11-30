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

// TODO: use same as remote-repository.js
const user             = 'mylife-home';
const repoPrefix       = 'mylife-home-core-plugins-';
const rootDirectory    = path.resolve(__dirname, '../..');
const modulesDirectory = path.join(rootDirectory, 'plugins');

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

module.exports = class ModuleRepository {

  constructor() {
    if(!fs.existsSync(modulesDirectory)) {
      fs.mkdirSync(modulesDirectory, 0o755);
    }
  }

  list() {
    return fs.readdirSync(modulesDirectory).map(moduleName => loadJson(path.join(modulesDirectory, moduleName, 'module.json')));
  }

  async install(moduleMetadata) {
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
  }

  // dev only
  async link(moduleMetadata) {
    const moduleDirectory     = path.join(modulesDirectory, moduleMetadata.name);
    const targetDirectoryName = repoPrefix + moduleMetadata.name;
    const targetDirectory     = path.resolve(path.join(rootDirectory, '..', targetDirectoryName));
    const targetPathRelative  = `../../../${targetDirectoryName}`;

    if(!await fs.exists(targetDirectory)) {
      throw new Error(`Module does not exist : '${targetDirectory}'`);
    }

    if(await fs.exists(moduleDirectory)) {
      // recreate
      await fs.remove(moduleDirectory);
    }

    // create folder and index
    await fs.mkdir(moduleDirectory, 0o755);
    await fs.symlink(targetPathRelative, path.join(moduleDirectory, moduleMetadata.commit));

    // create module.json
    saveJson(path.join(moduleDirectory, 'module.json'), moduleMetadata);
  }

  async uninstall(moduleMetadata) {
    const moduleDirectory = path.join(modulesDirectory, moduleMetadata.name);
    await fs.remove(moduleDirectory);
  }

  moduleEntry(moduleMetadata) {
    return path.join(modulesDirectory, moduleMetadata.name, moduleMetadata.commit);
  }

  moduleDirectory(moduleMetadata) {
    return path.join(modulesDirectory, moduleMetadata.name);
  }
};
