"use strict";

var AuthHelper = require('../lib/authhelper');
var Canonicalizer = require('../lib/canonicalizer');
var Escher = require('../lib/escher');
var Signer = require('../lib/signer');
var escherUtil = require('../lib/escherutil');

describe('AuthHelper', function () {
    describe('build', function () {
        runTestFiles(function(test){
            it('should return the proper auth header', function () {
                var authHeader = new AuthHelper(test.config).generateHeader(test.request, test.request.body, test.headersToSign);
                expect(authHeader).toBe(test.expected.authHeader);
            });
        });
    });
});

describe('Canonicalizer', function () {
    describe('canonicalizeRequest', function () {
        runTestFiles(function(test){
            it('should canonicalize the requests', function () {
                var canonicalizedRequest = new Canonicalizer('SHA256').canonicalizeRequest(test.request, test.request.body, test.headersToSign);
                expect(canonicalizedRequest).toBe(test.expected.canonicalizedRequest);
            });
        });
    });
});

describe('Escher', function () {
    describe('signRequest', function () {
        runTestFiles(function(test){
            it('should add signature to headers', function () {
                var signedRequest = new Escher(test.config).signRequest(test.request, test.request.body, test.headersToSign);
                expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequest.headers)))
                    .toBe(JSON.stringify(escherUtil.normalizeHeaders(test.expected.request.headers)));
            });
        });
    });
});

describe('Signer', function () {
    describe('getStringToSign', function () {
        runTestFiles(function(test){
            it('should return the proper string to sign', function () {
                var stringToSign = new Signer(test.config).getStringToSign(test.request, test.request.body, test.headersToSign);
                expect(stringToSign).toBe(test.expected.stringToSign);
            });
        });
    });
});
