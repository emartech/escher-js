"use strict";

var AuthHelper = require('../lib/authhelper'),
    specHelper = require('./spec_helper'),
    testConfig = require('./test_config'),
    using = specHelper.using,
    readTestFile = specHelper.readTestFile,
    TestFileParser = specHelper.TestFileParser;

describe('AuthHelper', function () {
    describe('build', function () {
        Object.keys(testConfig).forEach(function (testSuite) {
            using(testSuite + ' test files', testConfig[testSuite].files, function (testFile) {
                it('should return the proper auth header', function () {

                    var testFileParser = new TestFileParser(readTestFile(testSuite, testFile, 'req'));
                    var body = testFileParser.getBody();
                    var headers = testFileParser.getHeaders();

                    var requestOptions = {
                        method: testFileParser.getMethod(),
                        host: testFileParser.getHost(headers),
                        uri: testFileParser.getUri(),
                        headers: headers
                    };
                    var config = testConfig[testSuite].config;
                    config.date = testFileParser.getDate(headers);

                    var builder = new AuthHelper(config);

                    var authHeader = builder.generateHeader(requestOptions, body, testFileParser.getHeadersToSign());
                    expect(authHeader).toBe(readTestFile(testSuite, testFile, 'authz'));
                });
            });
        });

        it ('should use the provided signer config', function () {
            var requestOptions = {
                method: 'GET',
                host: 'www.example.com',
                uri: '/a_path',
                headers: []
            };

            var config = {
                hashAlgo: 'sha512',
                vendorPrefix: 'XYZ',
                date: new Date('Mon, 08 Sep 2011 23:36:00 GMT'),
                credentialScope: 'us-east-1/host/aws4_request'
            };

            var authHeader = new AuthHelper(config).generateHeader(requestOptions, 'body', []);

            expect(authHeader).toMatch(/^XYZ\-HMAC\-SHA512/);
        });
    });
});
