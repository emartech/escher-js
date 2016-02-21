'use strict';

var utils = require('../lib/utils');

describe('toHeaderDateFormat', function() {
  it('should format Date objects to header like format (RFC 822, updated by RFC 1123)', function() {
    var originalDateString = 'Fri, 09 Sep 2011 23:36:00 GMT';
    var formattedDateString = utils.toHeaderDateFormat(new Date(originalDateString));
    expect(formattedDateString).toBe(originalDateString);
  });
});

describe('normalizeHeaders', function() {
  it('should accept headers with integer value', function() {
    var headers = [['x-customer-id', 15]];

    var normalizedHeaders = utils.normalizeHeaders(headers);

    expect(normalizedHeaders).toEqual({ 'x-customer-id': '15' });
  });
});
