'use strict';

const Utils = require('../dist/utils');
const tape = require('tape');

module.exports = { runUtilTests };

function runUtilTests() {
  tape(
    'Utils #toHeaderDateFormat should format Date objects to header like format (RFC 822, updated by RFC 1123)',
    t => {
      const originalDateString = 'Fri, 09 Sep 2011 23:36:00 GMT';
      const formattedDateString = Utils.toHeaderDateFormat(new Date(originalDateString));
      t.equal(formattedDateString, originalDateString);
      t.end();
    }
  );

  tape('Utils #normalizeHeaders should accept headers with integer value', t => {
    const headers = [['x-customer-id', 15]];
    const normalizedHeaders = Utils.normalizeHeaders(headers);
    t.deepEqual(normalizedHeaders, { 'x-customer-id': '15' });
    t.end();
  });
}
