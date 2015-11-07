'use strict';

const Type = require('./type');

module.exports = class Enum extends Type {
  constructor(values) {
    this.values = Object.freeze(values);
  }

  toString() {
    return '{' + this.values.join(',') + '}';
  }
};