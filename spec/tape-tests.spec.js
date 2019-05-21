'use strict';

const { getTestCases } = require('./get-test-cases');
const { runAuthHelperTests } = require('./auth-helper.spec-tape');
const { runEscherTests } = require('./escher.spec-tape');
const { runSignerTests } = require('./signer.spec-tape');
const { runCanonicalizerTests } = require('./canonicalizer.spec-tape');
const { runDateHandlingTests } = require('./date-handling.spec-tape');
const { runUtilTests } = require('./utils.spec-tape');

getTestCases('escher-test-cases').then(testCases =>
  [
    runEscherTests,
    runAuthHelperTests,
    runSignerTests,
    runCanonicalizerTests,
    runDateHandlingTests,
    runUtilTests,
  ].forEach(runTests => runTests(testCases)),
);
