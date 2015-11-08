'use strict';

const chai     = require('chai');
const assert   = chai.assert;
const metadata = require('../lib/metadata');

describe('Types', function() {

  it('build range', function() {
    const type = metadata.Type.range(0, 10);
    assert(type.min === 0);
    assert(type.max === 10);
  });

  it('build enum', function() {
    const type = metadata.Type.enum('a', 'b', 'c');
    assert.deepEqual(type.values, ['a', 'b', 'c']);
    const type2 = metadata.Type.enum(['a', 'b', 'c']);
    assert.deepEqual(type2.values, ['a', 'b', 'c']);
  });

  it('type readonly', function() {
    const range = metadata.Type.range(0, 10);

    assert.throws(() => { range.min = 3; }, TypeError);
    assert.throws(() => { range.otherProp = 3; }, TypeError);

    const enum_ = metadata.Type.enum('a', 'b', 'c');
    assert.throws(() => { enum_.values.push('d'); }, TypeError);
  });

  it('type equality', function() {
    const range1 = metadata.Type.range(0, 20);
    const range2 = metadata.Type.range(0, 20);
    assert(range1 === range2);

    const enum1 = metadata.Type.enum('a', 'b', 'c');
    const enum2 = metadata.Type.enum('a', 'b', 'c');
    assert(enum1 === enum2);
  });

  it('type and string', function() {
    const srange = '[0;10]';
    const senum = '{a;b;c}';

    const range = metadata.Type.parse(srange);
    const enum_ = metadata.Type.parse(senum);

    assert(range === metadata.Type.range(0, 10));
    assert(enum_ === metadata.Type.enum('a', 'b', 'c'));

    assert(range.toString() === srange);
    assert(enum_.toString() === senum);
  });

});
