'use strict';

const EventEmitter = require('events');

class Binding extends EventEmitter {
  constructor(repository, action, remoteId, remoteAttribute) {
    super();
    this._repository      = repository;
    this._action          = action;
    this._remoteId        = remoteId;
    this._remoteAttribute = remoteAttribute;
    this._id              = Binding.createId(this._action, this._remoteId, this._remoteAttribute);
    this._boundRepoAdd    = this._repoAdd.bind(this);
    this._boundRepoChange = this._repoChange.bind(this);

    this._repository.addListener('add', this._boundRepoAdd);
    this._repository.addListener('change', this._boundRepoChange);
  }

  static createId(action, remoteId, remoteAttribute) {
    return action + '|' + remoteId + '|' + remoteAttribute;
  }

  close() {
    this.removeAllListeners();
    this._repository.removeListener('add', this._boundRepoAdd);
    this._repository.removeListener('change', this._boundRepoChange);
  }

  get id() { return this._id; }

  get action() { return this._action; }
  get remoteId() { return this._remoteId; }
  get remoteAttribute() { return this._remoteAttribute; }

  _repoAdd(id, obj) {
    if(id !== this._remoteId) { return; }
    if(obj.attributes.indexOf(this._remoteAttribute) < 0) { return; }
    const value = obj.attribute(this._remoteAttribute);
    this.emit('action', this, this._action, value);
  }

  _repoChange(id, name, newValue) {
    if(id !== this._remoteId) { return; }
    if(name !== this._remoteAttribute) { return; }
    this.emit('action', this, this._action, newValue);
  }
}

module.exports = Binding;
