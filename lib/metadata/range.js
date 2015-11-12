'use strict';

const Type = require('./type');

module.exports = class Range extends Type {
  constructor(min, max) {
    super();
    this.min = min;
    this.max = max;
  }

  toString() {
    return `[${this.min};${this.max}]`;
  }

  parse(str) {
    const val = parseInt(str);
    if(isNaN(val) ||
       val < this.min ||
       val > this.max) {
      throw new Error(`bad value: ${str} for type: ${this.ToString()}`);
    }
    return val;
  }

  format(value) {
    return value.toString();
  }
};