'use strict';

const common = require('mylife-home-common');

module.exports = class RemoteRepository {
  constructor() {
    this._list      = undefined;
    this._lastFetch = undefined;
  }

  fetch(done) {
    common.admin.pluginFetcher.all((err, list) => {
      if(err) { return done(err); }
      this.setFetchData(list);
      return done();
    });
  }

  setFetchData(list, date) {
    this._lastFetch = date || new Date();
    this._list = list;
  }

  list() {
    return this._list;
  }

  lastFetch() {
    return this._lastFetch;
  }
};
