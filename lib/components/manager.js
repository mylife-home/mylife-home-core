'use strict';

const Component = require('./component');

module.exports = class Manager {
  constructor(netConfig) {
    this._netConfig = netConfig;
    this._components = new Map();
  }

  list() {
    return Array.from(this._components.values());
  }

  create(pluginInfo, id, config, designer) {
    const comp = this._components.get(id);
    if(comp) { throw new Error('component already exists'); }
    this._components.set(id, new Component(id, designer, pluginInfo, config, this._netConfig));
  }

  setDesigner(id, designer) {
    const comp = this._components.get(id);
    if(!comp) { throw new Error('component does not exist'); }
    comp.designerData = designer;
  }

  delete(id, done) {
    const comp = this._components.get(id);
    if(!comp) { return setImmediate(done, 'component does not exist'); }
    this._components.delete(id);
    comp.close(done);
  }

  bind(id, action, remoteId, remoteAttribute) {
    console.log(id, action, remoteId, remoteAttribute);
    // TODO
  }

  unbind(id, action, remoteId, remoteAttribute) {
    console.log(id, action, remoteId, remoteAttribute);
    // TODO
  }
};
