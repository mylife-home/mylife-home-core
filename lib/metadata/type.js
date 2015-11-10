'use strict';

// {off;on}
// [0;100]

class Type {

}

module.exports = Type;

const Enum  = require('./enum');
const Range = require('./range');

Type.parse = function(value) {
  if(value.startsWith('[') && value.endsWith(']')) {
    let w = value.substr(1, value.length - 2);
    let parts = w.split(';');
    if(parts.length !== 2) { throw new Error('Invalid type: ' + value); }
    const min = parseInt(parts[0]);
    const max = parseInt(parts[1]);
    if(isNaN(min) || isNaN(max) || min >= max) { throw new Error('Invalid type: ' + value); }
    return Type.range(min, max);
  }
  if(value.startsWith('{') && value.endsWith('}')) {
    let w = value.substr(1, value.length - 2);
    let parts = w.split(';');
    return Type.enum(parts);
  }
  throw new Error('Invalid type: ' + value);
};

Type.range = function(min, max) {
  const type = new Range(min, max);
  return getCachedType(type);
};

Type.enum = function(values) {
  if(!Array.isArray(values)) {
    values = Array.from(arguments);
  }
  const type = new Enum(values);
  return getCachedType(type);
};

const cache = {};

function getCachedType(type) {
  const key = type.toString();
  let cachedType;
  if((cachedType = cache[key])) { return cachedType; }
  return (cache[key] = Object.freeze(type));
}
