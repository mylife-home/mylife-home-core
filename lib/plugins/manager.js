'use strict';

const async            = require('async');
const RemoteRepository = require('./remote-repository');
const LocalRepository  = require('./local-repository');

module.exports = class Manager {

  constructor() {
    this._remoteRepository = new RemoteRepository();
    this._localRepository  = new LocalRepository();
  }

  get local() {
    return this._localRepository;
  }

  fetch(done) {
    this._remoteRepository.fetch(done);
  }

  setFetchData(list, date) {
    this._remoteRepository.setFetchData(list, date);
  }

  lastFetch() {
    return this._remoteRepository.lastFetch();
  }

  remoteList() {
    return this._remoteRepository.list();
  }

  localList() {
    return this._localRepository.list();
  }

  install(name, unloader, reloader, done) {
    const remote = this.remoteList();
    if(!remote) { return setImmediate(done, 'list not available. fetch before'); }
    const remoteInfo = remote.find((info) => info.name === name);
    if(!remoteInfo) { return setImmediate(done, 'not found'); }
    const local = this.localList();
    const localInfo = local.find((info) => info.name === name);
    if(localInfo && localInfo.commit === remoteInfo.commit) { return setImmediate(done, 'already up to date'); }

    const tasks = [];

    if(localInfo) {
      tasks.push(unloader);
      tasks.push(cb => this._localRepository.uninstall(name, cb));
    }
    tasks.push(cb => this._localRepository.install(remoteInfo, cb));
    if(localInfo) {
      tasks.push(reloader);
    }

    async.series(tasks, done);
  }

  uninstall(name, done) {
    this._localRepository.uninstall(name, done);
  }

  load(name, unloader, reloader, done) {
    const loaded = !!this.localList().find((info) => info.name === name)
    const tasks = [];

    if(loaded) {
      tasks.push(unloader);
      tasks.push(cb => this.unload(name, cb));
    }
    tasks.push(cb => {
      let err;
      try {
        this._localRepository.load(name);
      } catch(e) {
        err = e;
      }
      return cb(err);
    });
    if(loaded) {
      tasks.push(reloader);
    }

    async.series(tasks, done);
  }

  unload(name, done) {
    let err;
    try {
      this._localRepository.unload(name);
    } catch(e) {
      err = e;
    }
    return done(err);
  }

  updateList() {
    const remoteList = this.remoteList();
    const localList = this.localList();
    if(!remoteList) {
      throw new Error('remote fetch before!');
    }

    const remoteMap = new Map();
    for(let it of remoteList) {
      remoteMap.set(it.name, it);
    }

    const ret = [];

    for(let local of localList) {
      const name = local.name;
      const remote = remoteMap.get(name);
      if(!remote) { continue; } // should not exist
      if(remote.commit !== local.commit) {
        ret.push({ name, remote, local });
      }
    }

    return ret;
  }
};
