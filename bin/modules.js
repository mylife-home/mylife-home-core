'use strict'

const ModuleRepository = require('../lib/plugins/module-repository');

const fs   = require('fs-extra');
const path = require('path');

const rootDirectory = path.resolve(__dirname, '..');

const repository = new ModuleRepository();

async function findMedataByName(name) {
  const list = await repository.list();
  return list.find(metadata => metadata.name === name);
}

(async function() {

  const command = process.argv[2];

  switch(command) {

    case 'clear': {
      const list = await repository.list();
      for(const metadata of list) {
        await repository.uninstall(metadata);
      }
      console.log('Modules cleared');
      break;
    }

    case 'install': {
      throw new Error('TODO');
    }

    case 'uninstall': {
      const moduleName = process.argv[3];
      const metadata = await findMedataByName(moduleName);
      if(!metadata) {
        console.log('Module does not exist');
        break;
      }

      console.log(`Uninstalling module '${moduleName}'`);
      await repository.uninstall(metadata);
      console.log('Modules uninstalled');
      break;
    }

    case 'link': {
      const moduleName = process.argv[3];
      const metadata = {
        name        : moduleName,
        description : 'Linked module',
        commit      : 'linked',
        date        : new Date().toISOString()
      };

      console.log(`Linking module '${moduleName}'`);
      await repository.link(metadata);
      console.log('Module linked');
      break;
    }
  }

})().catch(err => console.error(err));
