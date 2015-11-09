'use strict';

const Builder = require('./builder');

const cache = new Map();

module.exports = class Repository {

  static get(type) {
    let metadata = cache.get(type);
    if(metadata) { return metadata; }

    metadata = type.metadata;
    if(metadata instanceof Function) {
      const builder = new Builder();
      metadata(builder);
      metadata = builder.metdata;
    }

    cache.set(type, metadata);
    return metadata;
  }
};

// TODO: usage
// TODO: clazz string
// TODO: config string
/*
class Real {
  constructor() {
    this.attribute = 0;
  }

  action() {
    console.log('real action');
    ++this.attribute;
  }
};

Real.metadata = {
  usage: 'vpanel',
  attributes: {
    attribute: Type.range(0, 100)
  }
  actions: {
    action: []
  },
  configuration: {
    conf1: 'string',
    conf2: 'integer'
  }
}

Real.metadata = function(builder) {
  builder.usage.vpanel();
  builder.attribute('attribute', builder.range(0, 100));
  builder.action('action', ...);
};

const ptr = new Real();

let value = ptr.attribute;
Object.defineProperty(ptr, 'attribute', {
  get: () => {
    console.log('value get ' + value);
    return value;
  },
  set: (newValue) => {
    value = newValue;
    console.log('value setted to ' + value);
  }
});

const oldAction = ptr.action.bind(ptr);
ptr.action = function() {
  console.log('action begin');
  oldAction();
  console.log('action end');
}

ptr.action();
*/