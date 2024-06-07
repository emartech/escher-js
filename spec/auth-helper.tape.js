'use strict';

const tape = require('tape');
const AuthHelper = require('../lib/authhelper');
const Escher = require('../lib/escher');

module.exports = { runAuthHelperTests };

function runAuthHelperTests(testCases) {
  testCases.signrequest.forEach(runGenerateHeaderTape);
}

function runGenerateHeaderTape({ test, group, file }) {
  if (test.expected.authHeader) {
    tape(`[${group}] ${file} | AuthHelper #generateHeader`, t => {
      const authHeader = new AuthHelper(test.config, new Date(test.config.date)).generateHeader(
        test.request,
        test.request.body,
        new Escher(test.config).getHeadersToSign(test.headersToSign)
      );
      t.equal(authHeader, test.expected.authHeader);
      t.end();
    });
  }
}
