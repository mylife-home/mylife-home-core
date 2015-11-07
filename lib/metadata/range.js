'use strict';

const Type = require('./type');

module.exports = class Range extends Type {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }

  toString() {
    return `[${this.min};${this.max}]`;
  }
};