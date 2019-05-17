'use strict';

const Escher = require('../lib/escher');
const Utils = require('../lib/utils');
const Helper = require('./helper');
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
  testCases.signrequest.forEach(({ test, group }) => {
    const signRequest = () => new Escher(test.config).signRequest(test.request, test.request.body, test.headersToSign);
    tape(
      `${group} signRequest ${test.title}`,
      timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
        if (!test.expected.error) {
          const signedRequest = signRequest();
          t.deepEqual(
            Utils.normalizeHeaders(signedRequest.headers),
            Utils.normalizeHeaders(test.expected.request.headers),
          );
        } else {
          t.throws(signRequest, new Error(test.expected.error));
        }
        t.end();
      }),
    );
  });

  testCases.presignurl.forEach(({ test, group }) => {
    tape(
      `${group} preSignUrl ${test.title}`,
      timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
        const preSignedUrl = new Escher(test.config).preSignUrl(test.request.url, test.request.expires);
        t.equal(preSignedUrl, test.expected.url);
        t.end();
      }),
    );
  });

  testCases.authenticate.forEach(({ test, group }) => {
    const authenticate = () =>
      new Escher(test.config).authenticate(test.request, Helper.createKeyDb(test.keyDb), test.mandatorySignedHeaders);
    tape(
      `${group} authenticate ${test.title}`,
      timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
        if (!test.expected.error) {
          const key = authenticate();
          t.equal(key, test.expected.apiKey);
        } else {
          t.throws(authenticate, new Error(test.expected.error));
        }
        t.end();
      }),
    );
  });
});
