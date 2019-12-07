'use strict';

const tape = require('tape');
const AuthHelper = require('../dist/lib/authhelper');

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
        test.headersToSign
      );
      t.equal(authHeader, test.expected.authHeader);
      t.end();
    });
  }
}
