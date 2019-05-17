'use strict';

const Escher = require('../lib/escher');
const Utils = require('../lib/utils');
const tape = require('tape');
const { readFileSync } = require('fs');
const { timeDecorator } = require('./decorators');
const readdir = require('recursive-readdir');
const { allPass, test, complement, filter, pipe, map, split, groupBy, prop } = require('ramda');

const filterCases = allPass([test(/\.json$/), complement(test(/\/\./))]);

const splitParts = path => {
  const [, group, file] = split('/', path);
  const [method] = split('-', file);
  return { group, method, path };
};

const createTest = ({ path, ..._ }) => ({ test: JSON.parse(readFileSync(path)), ..._ });

const getTestCases = folder =>
  readdir(folder).then(
    pipe(
      filter(filterCases),
      map(splitParts),
      map(createTest),
      groupBy(prop('method')),
    ),
  );

getTestCases('escher-test-cases').then(testCases => {
  testCases.signrequest.forEach(({ test }) => {
    if (!test.expected.error) {
      tape(
        test.title || 'should sign the request properly',
        timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
          const signedRequest = new Escher(test.config).signRequest(
            test.request,
            test.request.body,
            test.headersToSign,
          );
          t.deepEqual(
            JSON.stringify(Utils.normalizeHeaders(signedRequest.headers)),
            JSON.stringify(Utils.normalizeHeaders(test.expected.request.headers)),
          );
          t.end();
        }),
      );
    }

    if (test.expected.error) {
      tape(
        test.title || 'should throw error',
        timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
          t.throws(
            () => new Escher(test.config).signRequest(test.request, test.request.body, test.headersToSign),
            new Error(test.expected.error),
          );
          t.end();
        }),
      );
    }
  });
});
