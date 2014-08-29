'use strict';

var Canonicalizer = require('../lib/canonicalizer'),
    specHelper = require('./spec_helper'),
    using = specHelper.using,
    AWSTestFileParser = specHelper.AWSTestFileParser,
    readTestFile = specHelper.readTestFile;

var awsTestFiles = [
    'get-vanilla',
    'post-vanilla',
    'get-vanilla-query',
    'post-vanilla-query',
    'get-vanilla-empty-query-key',
    'post-vanilla-empty-query-value',
    'get-vanilla-query-order-key',
    'post-x-www-form-urlencoded',
    'post-x-www-form-urlencoded-parameters',
    'get-header-value-trim',
//    'get-header-key-duplicate',
    'post-header-key-case',
    'post-header-key-sort',
//    'get-header-value-order',
    'post-header-value-case',
    'get-vanilla-query-order-value',
    'get-vanilla-query-order-key-case',
    'get-unreserved',
    'get-vanilla-query-unreserved',
    'get-vanilla-ut8-query',
    'get-utf8',
    'get-space',
    'post-vanilla-query-space',
//    'post-vanilla-query-nonunreserved',
    'get-slash',
    'get-slashes',
    'get-slash-dot-slash',
    'get-slash-pointless-dot',
    'get-relative',
    'get-relative-relative'
];

describe('Canonizer', function () {
    describe('canonicalizeRequest', function () {
        using('aws test files', awsTestFiles, function (testFile) {
            it('should canonicalize the requests', function () {

                var testFileParser = new AWSTestFileParser(readTestFile(testFile, 'req'));
                var body = testFileParser.getBody();
                var headers = testFileParser.getHeaders();

                var options = {
                    method: testFileParser.getMethod(),
                    host: testFileParser.getHost(headers),
                    uri: testFileParser.getUri(),
                    headers: headers
                };

                var canonicalizedRequest = new Canonicalizer().canonicalizeRequest(options, body);

                expect(canonicalizedRequest).toBe(readTestFile(testFile, 'creq'));
            });
        });
    });
});
