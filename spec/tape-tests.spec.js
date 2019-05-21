'use strict';

const { getTestCases } = require('./get-test-cases');
const { runAuthHelperTests } = require('./auth-helper.tape');
const { runEscherTests } = require('./escher.tape');
const { runSignerTests } = require('./signer.tape');
const { runCanonicalizerTests } = require('./canonicalizer.tape');
const { runDateHandlingTests } = require('./date-handling.tape');
const { runUtilTests } = require('./utils.tape');

getTestCases('escher-test-cases').then(testCases =>
  [
    runEscherTests,
    runAuthHelperTests,
    runSignerTests,
    runCanonicalizerTests,
    runDateHandlingTests,
    runUtilTests
  ].forEach(runTests => runTests(testCases))
);
