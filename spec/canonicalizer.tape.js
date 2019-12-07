'use strict';

const tape = require('tape');
const Canonicalizer = require('../dist/canonicalizer');

module.exports = { runCanonicalizerTests };

function runCanonicalizerTests(testCases) {
  testCases.signrequest.forEach(runCanonicalizeRequestTape);
}

function runCanonicalizeRequestTape({ test, group, file }) {
  if (test.expected.canonicalizedRequest) {
    tape(`[${group}] ${file} | Canonicalizer #canonicalizeRequest`, t => {
      const canonicalizedRequest = new Canonicalizer('SHA256').canonicalizeRequest(
        test.request,
        test.request.body,
        test.headersToSign
      );
      t.equal(canonicalizedRequest, test.expected.canonicalizedRequest);
      t.end();
    });
  }
}
