"use strict";

var AuthHeaderBuilder = require('../lib/authheaderbuilder'),
    specHelper = require('./spec_helper'),
    testConfig = require('./test_config'),
    using = specHelper.using,
    readTestFile = specHelper.readTestFile,
    TestFileParser = specHelper.TestFileParser;

describe('AuthHeaderBuilder', function () {
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
                    var signerConfig = testConfig[testSuite].signerConfig;
                    signerConfig.date = testFileParser.getDate(headers);

                    var builder = new AuthHeaderBuilder();

                    var authHeader = builder.build(requestOptions, body, signerConfig);
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

            var signerConfig = {
                hashAlgo: 'sha512',
                algoPrefix: 'XYZ',
                date: 'Mon, 08 Sep 2011 23:36:00 GMT'
            };

            var authHeader = new AuthHeaderBuilder().build(requestOptions, 'body', signerConfig);

            expect(authHeader).toMatch(/^XYZ\-HMAC\-SHA512/);
        });
    });
});
