'use strict';

const deepFreeze = require('deep-freeze');
const Builder    = require('./builder');

const cache = new Map();

function buildClazz(metadata) {
  const attributes = metadata.attributes;
  const actions    = metadata.actions;
  return Object.keys(actions).map((act) => {
    const params = actions[act].map((type) => type.toString()).join(',');
    return '.' + act + (params ? ',' + params : '');
  }).concat(Object.keys(attributes).map((attr) => {
    return '=' + attr + ',' + attributes[attr].toString();
  })).join('|');
}

function buildConfig(metadata) {
  const configuration = metadata.configuration;
  return Object.keys(configuration).map((name) => {
    let type;
    switch(configuration[name]) {
      case 'string': type = 's'; break;
      case 'integer': type = 'i'; break;
      default: throw new Error('Unknown type');
    }
    return type + ':' + name;
  }).join('|');
}

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

    metadata.strings = {
      clazz  : buildClazz(metadata),
      config : buildConfig(metadata)
    };

    metadata = deepFreeze(metadata);
    cache.set(type, metadata);
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