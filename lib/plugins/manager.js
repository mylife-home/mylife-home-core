'use strict';

const RemoteRepository = require('./remote-repository');
const LocalRepository  = require('./local-repository');

module.exports = class {

  constructor() {
    this._remoteRepository = new RemoteRepository();
    this._localRepository  = new LocalRepository();
  }

  fetch(done) {
    this._remoteRepository.fetch((err) => {
      if(err) { done(err); }
      return this._remoteRepository.list();
    });
  }
};
