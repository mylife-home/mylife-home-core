'use strict';

const EventEmitter = require('events');

module.exports = class Wrapper extends EventEmitter {
  constructor(target, metadata) {
    super();

    this.target = target;
    this.metadata = metadata;

    this.attributes = {};

    for(let attributeName of Object.keys(metadata.attributes)) {
      this._createAttribute(attributeName);
    }
  }

  _createAttribute(attributeName) {
    // initial value
    this.attributes[attributeName] = this.target[attributeName];

    Object.defineProperty(this.target, attributeName, {
      get : () => this.attributes[attributeName],
      set : (newValue) => {
        this.attributes[attributeName] = newValue;
        this.emit('attributeChanged', attributeName, newValue);
      }
    });
  }

  action(actionName, args) {
    this.target[actionName].apply(this.target, args);
  }

  close(done) {
    if(!this.target.close) {
      setImmediate(done);
    }
    this.target.close(done);
  }
};
