"use strict";

var AuthHelper = require('../lib/authhelper');

describe('AuthHelper', function () {
    describe('build', function () {

        runTestFiles(function(test){
            it('should return the proper auth header', function () {
                var authHeader = new AuthHelper(test.config).generateHeader(test.request, test.request.body, test.headersToSign);
                expect(authHeader).toBe(test.expected.authHeader);
            });
        });

        // TODO: this should be moved to a testfile
        it ('should use the provided signer config', function () {
            var requestOptions = {
                method: 'GET',
                host: 'www.example.com',
                url: '/a_path',
                headers: []
            };

            var config = {
                hashAlgo: 'SHA512',
                vendorKey: 'XYZ',
                algoPrefix: 'XYZ',
                date: new Date('Mon, 08 Sep 2011 23:36:00 GMT'),
                credentialScope: 'us-east-1/host/aws4_request'
            };

            var authHeader = new AuthHelper(config).generateHeader(requestOptions, 'body', []);

            expect(authHeader).toMatch(/^XYZ\-HMAC\-SHA512/);
        });
    });
});
