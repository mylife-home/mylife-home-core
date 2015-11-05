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
};
