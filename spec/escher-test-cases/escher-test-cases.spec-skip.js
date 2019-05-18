'use strict';

const Escher = require('../../lib/escher');
const Utils = require('../../lib/utils');
const Helper = require('../helper');
const tape = require('tape');
const { timeDecorator } = require('./decorators');
const { getTestCases } = require('./get-test-cases');

getTestCases('escher-test-cases').then(testCases => {
  testCases.signrequest.forEach(runSignRequestTape);
  testCases.presignurl.forEach(runPreSignUrlTape);
  testCases.authenticate.forEach(runAuthehticationTape);
});

function runSignRequestTape({ test, group, method }) {
  tape(
    createTitle(test.title, group, method),
    timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
      if (!test.expected.error) {
        const signedRequest = signRequest(test);
        t.deepEqual(
          Utils.normalizeHeaders(signedRequest.headers),
          Utils.normalizeHeaders(test.expected.request.headers),
        );
      } else {
        t.throws(() => signRequest(test), new Error(test.expected.error));
      }
      t.end();
    }),
  );
}

function signRequest(test) {
  return new Escher(test.config).signRequest(test.request, test.request.body, test.headersToSign);
}

function runPreSignUrlTape({ test, group, method }) {
  tape(
    createTitle(test.title, group, method),
    timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
      const preSignedUrl = new Escher(test.config).preSignUrl(test.request.url, test.request.expires);
      t.equal(preSignedUrl, test.expected.url);
      t.end();
    }),
  );
}

function runAuthehticationTape({ test, group, method }) {
  tape(
    createTitle(test.title, group, method),
    timeDecorator({ timestamp: new Date(test.config.date).getTime() }, t => {
      if (!test.expected.error) {
        const key = authenticate(test);
        t.equal(key, test.expected.apiKey);
      } else {
        t.throws(() => authenticate(test), new Error(test.expected.error));
      }
      t.end();
    }),
  );
}

function authenticate(test) {
  return new Escher(test.config).authenticate(
    test.request,
    Helper.createKeyDb(test.keyDb),
    test.mandatorySignedHeaders,
  );
}

function createTitle(title, group, method) {
  return `[${group}] #${method} ${title}`;
}
