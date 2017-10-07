'use strict';

var Escher = require('../lib/escher');
var AuthHelper = require('../lib/authhelper');
var Canonicalizer = require('../lib/canonicalizer');
var Signer = require('../lib/signer');
var utils = require('../lib/utils');
var helper = require('./helper');

describe('Escher', function() {

  describe('signRequest', function() {
    helper.runTestFiles('signRequest', function(test) {
      if (!test.expected.error) {
        it(test.title || 'should sign the request properly', function() {
          var signedRequest = new Escher(test.config).signRequest(test.request, test.request.body, test
            .headersToSign);
          expect(JSON.stringify(utils.normalizeHeaders(signedRequest.headers)))
            .toBe(JSON.stringify(utils.normalizeHeaders(test.expected.request.headers)));
        });
      }

      if (test.expected.error) {
        it(test.title || 'should throw error', function() {
          expect(function() {
            new Escher(test.config).signRequest(test.request, test.request.body, test.headersToSign);
          }).toThrow(new Error(test.expected.error));
        });
      }
    });
  });

  describe('presignUrl', function() {
    helper.runTestFiles('presignUrl', function(test) {
      it(test.title || 'should presign the URL properly', function() {
        var preSignedUrl = new Escher(test.config).preSignUrl(test.request.url, test.request.expires);
        expect(preSignedUrl).toBe(test.expected.url);
      });
    });
  });

  describe('authenticate', function() {
    helper.runTestFiles('authenticate', function(test) {
      if (test.expected.apiKey) {
        it(test.title || 'should authenticate and return with apiKey', function() {
          var key = new Escher(test.config).authenticate(test.request, helper.createKeyDb(test.keyDb));
          expect(key).toBe(test.expected.apiKey);
        });
      }

      if (test.expected.error) {
        it(test.title || 'should authenticate and return with an error', function() {
          expect(function() {
            new Escher(test.config).authenticate(test.request, helper.createKeyDb(test.keyDb), test.mandatorySignedHeaders);
          }).toThrow(new Error(test.expected.error));
        });
      }
    });

    // let's reverse the signRequest tests, and reuse them for checking authenticate
    helper.runTestFiles('signRequest', function(test) {
      if (!test.expected.error) {
        it('should authenticate a properly signed request as valid', function() {
          var key = new Escher(test.config).authenticate(test.expected.request, helper.createKeyDb([
            [test.config.accessKeyId, test.config.apiSecret],
            ['some_other_apikey', 'some_other_secret']
          ]));
          expect(key).toBe(test.config.accessKeyId);
        });
      }
    });
  });
});

describe('AuthHelper', function() {
  describe('build', function() {
    helper.runTestFiles('signRequest', function(test) {
      if (test.expected.authHeader) {
        it(test.title || 'should return the proper auth header', function() {
          var authHeader = new AuthHelper(test.config).generateHeader(test.request, test.request.body,
            test.headersToSign);
          expect(authHeader).toBe(test.expected.authHeader);
        });
      }
    });
  });
});

describe('Canonicalizer', function() {
  describe('canonicalizeRequest', function() {
    helper.runTestFiles('signRequest', function(test) {
      if (test.expected.canonicalizedRequest) {
        it(test.title || 'should canonicalize the requests', function() {
          var canonicalizedRequest = new Canonicalizer('SHA256').canonicalizeRequest(
            test.request, test.request.body, test.headersToSign);
          expect(canonicalizedRequest).toBe(test.expected.canonicalizedRequest);
        });
      }
    });
  });
});

describe('Signer', function() {
  describe('getStringToSign', function() {
    helper.runTestFiles('signRequest', function(test) {
      if (test.expected.stringToSign) {
        it(test.title || 'should return the proper string to sign', function() {
          var stringToSign = new Signer(test.config).getStringToSign(test.request, test.request.body,
            test.headersToSign);
          expect(stringToSign).toBe(test.expected.stringToSign);
        });
      }
    });
  });
});
