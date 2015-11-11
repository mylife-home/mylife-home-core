'use strict';

module.exports = class Proxy {
  constructor(target, metadata) {
    this._target = target;
    this._metadata = metadata;
  }

};

/*
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