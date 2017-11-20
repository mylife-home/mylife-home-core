'use strict'

const fs   = require('fs-extra');
const path = require('path');

const rootDirectory    = path.resolve(__dirname, '..');
const modulesDirectory = path.join(rootDirectory, 'plugins');
const repoPrefix       = 'mylife-home-core-plugins-';

const command = process.argv[2];

switch(command) {

  case 'clear':
    fs.emptyDirSync(modulesDirectory);
    console.log('Modules cleared');
    break;

  case 'unlink': {
    const moduleName = process.argv[3];
    const moduleDirectory = path.join(modulesDirectory, moduleName);

    if(!fs.existsSync(moduleDirectory)) {
      console.log('Module does not exist');
      break;
    }

    console.log(`Unlinking module '${moduleName}'`);
    fs.removeSync(moduleDirectory);
    console.log('Modules unlinked');
    break;
  }

  case 'link': {
    const moduleName = process.argv[3];
    const moduleDirectory = path.join(modulesDirectory, moduleName);
    const targetDirectory = path.resolve(path.join(rootDirectory, '..', repoPrefix + moduleName));

    if(!fs.existsSync(targetDirectory)) {
      console.log(`Module does not exist : '${targetDirectory}'`);
      break;
    }

    console.log(`Linking module '${moduleName}'`);

    if(fs.existsSync(moduleDirectory)) {
      console.log('Already installed, recreating');
      fs.removeSync(moduleDirectory);
    }

    // create folder and index
    fs.mkdir(moduleDirectory, 0o755);
    fs.symlinkSync(`../../../${repoPrefix}${moduleName}`, path.join(moduleDirectory, 'linked'));

    const packageJson = {
      main : './linked',
      moduleMetadata : {
        name        : moduleName,
        description : 'Linked module',
        commit      : 'linked',
        date        : new Date().toISOString()
      }
    };

    fs.writeFileSync(path.join(moduleDirectory, 'package.json'), JSON.stringify(packageJson, null, 2), { mode : 0o644 });
    console.log('Module linked');
    break;
  }
}
//stats.isDirectory()
//stats.isSymbolicLink()