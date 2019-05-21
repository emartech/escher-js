'use strict';

const Canonicalizer = require('../lib/canonicalizer');
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
