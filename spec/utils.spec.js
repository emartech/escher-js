'use strict';

const Utils = require('../lib/utils');

describe('toHeaderDateFormat', function() {
  it('should format Date objects to header like format (RFC 822, updated by RFC 1123)', function() {
    const originalDateString = 'Fri, 09 Sep 2011 23:36:00 GMT';
    const formattedDateString = Utils.toHeaderDateFormat(new Date(originalDateString));
    expect(formattedDateString).toBe(originalDateString);
  });
});

describe('normalizeHeaders', function() {
  it('should accept headers with integer value', function() {
    const headers = [['x-customer-id', 15]];

    const normalizedHeaders = Utils.normalizeHeaders(headers);

    expect(normalizedHeaders).toEqual({ 'x-customer-id': '15' });
  });
});
