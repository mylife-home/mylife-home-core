'use strict';

const Builder = require('./builder');

module.exports = class Repository {
  constructor() {
    this._types = new Map();
  }

  get(type) {
    let metadata = this._types.get(type);
    if(metadata) { return metadata; }

    metadata = type.metadata;
    if(metadata instanceof Function) {
      const builder = new Builder();
      metadata(builder);
      metadata = builder.metdata;
    }

    this._types.set(type, metadata);
    return metadata;
  }
};


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