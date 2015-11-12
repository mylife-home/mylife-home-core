'use strict';

const RemoteRepository = require('./remote-repository');
const LocalRepository  = require('./local-repository');

module.exports = class Manager {

  constructor() {
    this._remoteRepository = new RemoteRepository();
    this._localRepository  = new LocalRepository();
  }

  fetch(done) {
    this._remoteRepository.fetch(done);
  }

  remoteList() {
    return this._remoteRepository.list();
  }

  localList() {
    return this._localRepository.list();
  }

  install(name, done) {
    const remote = this.remoteList();
    if(!remote) { return setImmediate(done, 'list not available. fetch before'); }
    const remoteInfo = remote.find((info) => info.name === name);
    if(!remoteInfo) { return setImmediate(done, 'not found'); }
    const local = this.localList();
    if(local.find((info) => info.name === name)) { return setImmediate(done, 'update not supported now'); }
    this._localRepository.install(remoteInfo, done);
  }

  uninstall(name, done) {
    setImmediate(done, 'not implemented');
  }

  get local() {
    return this._localRepository;
  }
};
