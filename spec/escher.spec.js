'use strict';

const Escher = require('../lib/escher');

describe('Escher', function() {
  it('should return an instance of Escher after new keyword', function() {
    const escher = new Escher();
    expect(escher instanceof Escher).toEqual(true);
  });
  it('should return an instance of Escher with create method', function() {
    const escher = Escher.create();
    expect(escher instanceof Escher).toEqual(true);
  });
});
