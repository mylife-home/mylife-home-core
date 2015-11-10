'use strict';

// class=.toggle|.play|.pause|.set_volume,[0;100]|=connected,{off;on}|=playing,{off;on}|=volume,[0;100]
// config=s:host|i:port

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

    const self = this;
    this.usage = {
      ui     : function() { self.metadata.usage = 'ui';     return self; },
      vpanel : function() { self.metadata.usage = 'vpanel'; return self; },
      driver : function() { self.metadata.usage = 'driver'; return self; },
    };
  }

  action(name, ...types) {
    this.metadata.actions[name] = types;
    return this;
  }

  attribute(name, type) {
    this.metadata.attributes[name] = type;
    return this;
  }

  config(name, type) {
    this.metadata.configuration[name] = type;
    return this;
  }

};
