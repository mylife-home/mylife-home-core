'use strict';

const Type = require('./type');

module.exports = class Builder {
  constructor() {
    this.range    = Type.range;
    this.enum     = Type.enum;

    this.metadata = {
      actions       : {},
      attributes    : {},
      configuration : {}
    };
  }

  action(name, ...types) {
    this.metadata.actions[name] = types;
  }

  attribute(name, type) {
    this.metadata.attributes[name] = type;
  }

  config(name, type) {
    this.metadata.configuration[name] = type;
  }
};
