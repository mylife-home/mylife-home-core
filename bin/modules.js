'use strict'

const common           = require('mylife-home-common');
const ModuleRepository = require('../lib/plugins/module-repository');

const repository = new ModuleRepository();

let _remoteList;

async function findMedataByName(name) {
  const list = await repository.list();
  return list.find(metadata => metadata.name === name);
}

async function remoteList() {
  // cache it
  if(!_remoteList) {
    _remoteList = await common.utils.promise.fromCallback(done => common.admin.pluginFetcher(done))();
  }
  return _remoteList;
}

async function findRemoteMedataByName(name) {
  const list = await remoteList();
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
      const moduleName = process.argv[3];
      const metadata = await findRemoteMedataByName(moduleName);
      if(!metadata) {
        console.error('Module does not exist');
        break;
      }

      console.log(`Installing module '${moduleName}'`);
      await repository.install(metadata);
      console.log('Modules installed');
      break;
    }

    case 'uninstall': {
      const moduleName = process.argv[3];
      const metadata = await findMedataByName(moduleName);
      if(!metadata) {
        console.error('Module does not exist');
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
