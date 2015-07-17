'use strict';

var Escher = require('../lib/escher');
var AuthHelper = require('../lib/authhelper');
var Canonicalizer = require('../lib/canonicalizer');
var Signer = require('../lib/signer');
var utils = require('../lib/utils');

describe('AuthHelper', function() {
  describe('build', function() {
    runTestFiles('signature', function(test) {
      it('should return the proper auth header', function() {
        var authHeader = new AuthHelper(test.config).generateHeader(test.request, test.request.body,
          test.headersToSign);
        expect(authHeader).toBe(test.expected.authHeader);
      });
    });
  });
});

describe('Canonicalizer', function() {
  describe('canonicalizeRequest', function() {
    runTestFiles('signature', function(test) {
      it('should canonicalize the requests', function() {
        var canonicalizedRequest = new Canonicalizer('SHA256').canonicalizeRequest(test.request, test.request
          .body, test.headersToSign);
        expect(canonicalizedRequest).toBe(test.expected.canonicalizedRequest);
      });
    });
  });
});

describe('Escher', function() {
  describe('signRequest', function() {
    runTestFiles('signature', function(test) {
      it('should add signature to headers', function() {
        var signedRequest = new Escher(test.config).signRequest(test.request, test.request.body, test.headersToSign);
        expect(JSON.stringify(utils.normalizeHeaders(signedRequest.headers)))
          .toBe(JSON.stringify(utils.normalizeHeaders(test.expected.request.headers)));
      });
    });
  });

  describe('authenticate', function() {
    runTestFiles('authenticate', function(test) {
      if (test.expected.apiKey) {
        it('should authenticate and return with apiKey', function() {
          var keyDb = function(key) {
            for (var i = 0; i < test.keyDb.length; i++) {
              if (test.keyDb[i][0] == key) {
                return test.keyDb[i][1];
              }
            }
          }

          var key = new Escher(test.config).authenticate(test.request, keyDb);
          expect(key).toBe(test.expected.apiKey);
        });
      }
    });
  });
});

describe('Signer', function() {
  describe('getStringToSign', function() {
    runTestFiles('signature', function(test) {
      it('should return the proper string to sign', function() {
        var stringToSign = new Signer(test.config).getStringToSign(test.request, test.request.body,
          test.headersToSign);
        expect(stringToSign).toBe(test.expected.stringToSign);
      });
    });
  });
});
