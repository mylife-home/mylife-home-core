'use strict';

const RemoteRepository = require('./remote-repository');
const LocalRepository  = require('./local-repository');

module.exports = class {

  constructor() {
    this._remoteRepository = new RemoteRepository();
    this._localRepository  = new LocalRepository();
  }

  remoteList(done) {
    this._remoteRepository.refresh((err) => {
      if(err) { done(err); }
      return this._remoteRepository.list();
    });
  }
};
