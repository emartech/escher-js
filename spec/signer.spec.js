'use strict';

var Signer = require('../lib/signer'),
    specHelper = require('./spec_helper'),
    using = specHelper.using,
    AWSTestFileParser = specHelper.AWSTestFileParser,
    readTestFile = specHelper.readTestFile,
    bin2hex = specHelper.bin2hex;

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
    'post-vanilla-query-nonunreserved',
    'get-slash',
    'get-slashes',
    'get-slash-dot-slash',
    'get-slash-pointless-dot',
    'get-relative',
    'get-relative-relative'
];

describe('Signer', function () {
    describe('getStringToSign', function () {
        using('aws test files', awsTestFiles, function (testFile) {
            it('should return the proper string to sign', function () {

                var testFileParser = new AWSTestFileParser(readTestFile(testFile, 'req'));
                var body = testFileParser.getBody();
                var headers = testFileParser.getHeaders();

                var options = {
                    method: testFileParser.getMethod(),
                    host: testFileParser.getHost(headers),
                    uri: testFileParser.getUri(),
                    headers: headers
                };

                var signerOptions = {
                    hashAlgo: "sha256",
                    date: testFileParser.getDate(headers),
                    algoPrefix: 'AWS4',
                    credentialScope: 'us-east-1/host/aws4_request',
                    apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
                };
                var stringToSign = new Signer().getStringToSign(options, body, signerOptions);

                expect(stringToSign).toBe(readTestFile(testFile, 'sts'));
            });
        });
    });

    describe('calculateSigningKey', function() {
        var signerOptions = {
            hashAlgo: "sha256",
            date: new Date(Date.parse('2011-09-09 23:36:00 UTC')),
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/iam/aws4_request',
            apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
        };

        var signingKey = new Signer().calculateSigningKey(signerOptions);

        expect(bin2hex(signingKey)).toBe('98f1d889fec4f4421adc522bab0ce1f82e6929c262ed15e5a94c90efd1e3b0e7');
    });

    describe('calculateSignature', function() {
        var signerOptions = {
            hashAlgo: "sha256",
            date: new Date(Date.parse('Mon, 09 Sep 2011 23:36:00 GMT')),
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request',
            apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
        };

        var signer = new Signer();
        var stringToSign = "AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/host/aws4_request\n366b91fb121d72a00f46bbe8d395f53a102b06dfb7e79636515208ed3fa606b1";
        var signingKey = new Signer().calculateSigningKey(signerOptions);
        var signature = signer.calculateSignature(stringToSign, signingKey, signerOptions);

        expect(signature).toBe('b27ccfbfa7df52a200ff74193ca6e32d4b48b8856fab7ebf1c595d0670a7e470');
    });
});
