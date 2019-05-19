'use strict';

const AuthHelper = require('../lib/authhelper');
const Canonicalizer = require('../lib/canonicalizer');
const Signer = require('../lib/signer');
const Helper = require('./helper');

describe('AuthHelper', function() {
  describe('build', function() {
    Helper.runTestFiles('signRequest', function(test) {
      if (test.expected.authHeader) {
        it(test.title || 'should return the proper auth header', function() {
          const authHeader = new AuthHelper(test.config, new Date(test.currentDate)).generateHeader(
            test.request,
            test.request.body,
            test.headersToSign,
          );
          expect(authHeader).toBe(test.expected.authHeader);
        });
      }
    });
  });
});

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
