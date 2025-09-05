'use strict';

const tape = require('tape');
const Signer = require('../lib/signer');
const Escher = require('../lib/escher');

module.exports = { runSignerTests };

function runSignerTests(testCases) {
  testCases.signrequest.forEach(runGetStringToSignTape);
}

function runGetStringToSignTape({ test, group, file }) {
  if (test.config.hashAlgo && test.expected.stringToSign) {
    tape(`[${group}] ${file} | Signer #getStringToSign`, t => {
      const stringToSign = new Signer(test.config, new Date(test.config.date)).getStringToSign(
        test.request,
        test.request.body,
        new Escher(test.config).getHeadersToSign(test.headersToSign)
      );
      t.equal(stringToSign, test.expected.stringToSign);
      t.end();
    });
  }
}
