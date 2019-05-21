'use strict';

const { getTestCases } = require('./get-test-cases');
const { runAuthHelperTests } = require('./auth-helper.spec-tape');
const { runEscherTests } = require('./escher-test-cases.spec-tape');
const { runSignerTests } = require('./signer.spec-tape');
const { runCanonicalizerTests } = require('./canonicalizer.spec-tape');

getTestCases('escher-test-cases').then(testCases =>
  [runEscherTests, runAuthHelperTests, runSignerTests, runCanonicalizerTests].forEach(runTests => runTests(testCases)),
);
