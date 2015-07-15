'use strict';

var escherUtil = require('../lib/escherutil');

describe('toHeaderDateFormat', function() {
  it('should format Date objects to header like format (RFC 822, updated by RFC 1123)', function() {
    var originalDateString = 'Fri, 09 Sep 2011 23:36:00 GMT';
    var formattedDateString = escherUtil.toHeaderDateFormat(new Date(originalDateString));
    expect(formattedDateString).toBe(originalDateString);
  });
});
