'use strict';

const Escher = require('../dist/escher');
const Utils = require('../dist/utils');
const tape = require('tape');
const { timeDecorator } = require('./decorators');

module.exports = { runEscherTests };

function runEscherTests(testCases) {
  testCases.signrequest.forEach(runSignRequestTape);
  testCases.presignurl.forEach(runPreSignUrlTape);
  testCases.authenticate.forEach(runAuthehticationTape);
  testCases.signrequest.forEach(runReverseSignRequestTape);
  runEscherCreateTape();
}

function runSignRequestTape({ test, group, method, file }) {
  tape(
    createTitle(test.title, group, method, file),
    timeDecorator({ timestamp: new Date(test.config.date).getTime() }, ({ args: [t] }) => {
      if (!test.expected.error) {
        const signedRequest = signRequest(test);
        t.deepEqual(
          Utils.normalizeHeaders(signedRequest.headers),
          Utils.normalizeHeaders(test.expected.request.headers)
        );
      } else {
        t.throws(() => signRequest(test), new Error(test.expected.error));
      }
      t.end();
    })
  );
}

function signRequest(test) {
  return new Escher(test.config).signRequest(test.request, test.request.body, test.headersToSign);
}

function runPreSignUrlTape({ test, group, method, file }) {
  tape(
    createTitle(test.title, group, method, file),
    timeDecorator({ timestamp: new Date(test.config.date).getTime() }, ({ args: [t] }) => {
      const preSignedUrl = new Escher(test.config).preSignUrl(test.request.url, test.request.expires);
      t.equal(preSignedUrl, test.expected.url);
      t.end();
    })
  );
}

function runAuthehticationTape({ test, group, method, file }) {
  tape(
    createTitle(test.title, group, method, file),
    timeDecorator({ timestamp: new Date(test.config.date).getTime() }, ({ args: [t] }) => {
      if (!test.expected.error) {
        const key = authenticate(test);
        t.equal(key, test.expected.apiKey);
      } else {
        t.throws(() => authenticate(test), new Error(test.expected.error));
      }
      t.end();
    })
  );
}

function authenticate(test) {
  return new Escher(test.config).authenticate(test.request, createKeyDb(test.keyDb), test.mandatorySignedHeaders);
}

function runReverseSignRequestTape({ test, group }) {
  if (!test.expected.error) {
    tape(
      `[${group}] should authenticate a properly signed request as valid`,
      timeDecorator({ timestamp: new Date(test.config.date).getTime() }, ({ args: [t] }) => {
        const key = new Escher(test.config).authenticate(
          test.expected.request,
          createKeyDb([[test.config.accessKeyId, test.config.apiSecret], ['some_other_apikey', 'some_other_secret']])
        );
        t.equal(key, test.config.accessKeyId);
        t.end();
      })
    );
  }
}

function createTitle(title, group, method, file) {
  return `[${group}] ${file} | Escher #${method} ${title}`;
}

function runEscherCreateTape() {
  tape('should return an instance of Escher after new keyword', t => {
    const escher = new Escher();
    t.equal(escher instanceof Escher, true);
    t.end();
  });

  tape('should return an instance of Escher with create method', t => {
    const escher = Escher.create();
    t.equal(escher instanceof Escher, true);
    t.end();
  });
}

function createKeyDb(keyDb) {
  return key => {
    for (let i = 0; i < keyDb.length; i++) {
      if (keyDb[i][0] === key) {
        return keyDb[i][1];
      }
    }
  };
}
