'use strict';

const Signer = require('../dist/src/deprecated/signer');
const tape = require('tape');

module.exports = { runSignerTests };

function runSignerTests(testCases) {
  testCases.signrequest.forEach(runGetStringToSignTape);
}

function runGetStringToSignTape({ test, group, file }) {
  if (test.expected.stringToSign) {
    tape(`[${group}] ${file} | Signer #getStringToSign`, t => {
      const stringToSign = new Signer(test.config, new Date(test.config.date)).getStringToSign(
        test.request,
        test.request.body,
        test.headersToSign,
      );
      t.equal(stringToSign, test.expected.stringToSign);
      t.end();
    });
  }
}
