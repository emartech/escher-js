'use strict';

const Canonicalizer = require('../lib/canonicalizer');
const Signer = require('../lib/signer');
const Helper = require('./helper');

describe('Canonicalizer', function() {
  describe('canonicalizeRequest', function() {
    Helper.runTestFiles('signRequest', function(test) {
      if (test.expected.canonicalizedRequest) {
        it(test.title || 'should canonicalize the requests', function() {
          const canonicalizedRequest = new Canonicalizer('SHA256').canonicalizeRequest(
            test.request,
            test.request.body,
            test.headersToSign,
          );
          expect(canonicalizedRequest).toBe(test.expected.canonicalizedRequest);
        });
      }
    });
  });
});

describe('Signer', function() {
  describe('getStringToSign', function() {
    Helper.runTestFiles('signRequest', function(test) {
      if (test.expected.stringToSign) {
        it(test.title || 'should return the proper string to sign', function() {
          const stringToSign = new Signer(test.config, new Date(test.currentDate)).getStringToSign(
            test.request,
            test.request.body,
            test.headersToSign,
          );
          expect(stringToSign).toBe(test.expected.stringToSign);
        });
      }
    });
  });
});
