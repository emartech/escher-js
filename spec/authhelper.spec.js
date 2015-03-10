"use strict";

var AuthHelper = require('../lib/authhelper');

describe('AuthHelper', function () {
    describe('build', function () {
        it ('should use the provided signer config', function () {
            var request = {
                method: 'GET',
                host: 'www.example.com',
                url: '/a_path',
                headers: []
            };
            var config = {
                hashAlgo: 'SHA512',
                vendorKey: 'ABC',
                algoPrefix: 'XYZ',
                date: new Date(),
                credentialScope: 'us-east-1/host/aws4_request'
            };
            var authHeader = new AuthHelper(config).generateHeader(request, 'body', []);
            expect(authHeader).toMatch(/^XYZ\-HMAC\-SHA512/);
        });
    });
});
