'use strict';

var Escher = require('../lib/escher');
var AuthHelper = require('../lib/authhelper');
var utils = require('../lib/utils');

describe('Escher', function() {
  it('should return an instance of Escher after new keyword', function() {
    var escher = new Escher();
    expect(escher instanceof Escher).toEqual(true);
  });
});
