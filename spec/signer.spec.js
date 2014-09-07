'use strict';

var Signer = require('../lib/signer'),
    testConfig = require('./test_config'),
    specHelper = require('./spec_helper'),
    using = specHelper.using,
    TestFileParser = specHelper.TestFileParser,
    readTestFile = specHelper.readTestFile,
    bin2hex = specHelper.bin2hex;

describe('Signer', function () {
    describe('getStringToSign', function () {
        Object.keys(testConfig).forEach(function (testSuite) {
            using(testSuite + ' test files', testConfig[testSuite].files, function (testFile) {
                it('should return the proper string to sign', function () {

                    var testFileParser = new TestFileParser(readTestFile(testSuite, testFile, 'req'));
                    var body = testFileParser.getBody();
                    var headers = testFileParser.getHeaders();

                    var requestOptions = {
                        method: testFileParser.getMethod(),
                        host: testFileParser.getHost(headers),
                        url: testFileParser.getUri(),
                        headers: headers
                    };
                    var config = testConfig[testSuite].config;
                    config.date = testFileParser.getDate(headers);
                    var signer = new Signer(config);

                    var stringToSign = signer.getStringToSign(requestOptions, body, testFileParser.getHeadersToSign());
                    expect(stringToSign).toBe(readTestFile(testSuite, testFile, 'sts'));
                });
            });
        });
    });

    describe('calculateSigningKey', function () {
        it('should calculate the signing key', function () {
            var signer = new Signer({
                vendorKey: 'AWS4',
                algoPrefix: 'AWS4',
                hashAlgo: "SHA256",
                date: new Date("2011-09-09 23:36:00 UTC"),
                credentialScope: 'us-east-1/iam/aws4_request',
                apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
            });
            var signingKey = signer.calculateSigningKey();
            expect(bin2hex(signingKey)).toBe('98f1d889fec4f4421adc522bab0ce1f82e6929c262ed15e5a94c90efd1e3b0e7');
        });
    });

    describe('calculateSignature', function () {
        it('should calculate the signature', function () {
            var signer = new Signer({
                vendorKey: 'AWS4',
                algoPrefix: 'AWS4',
                hashAlgo: "SHA256",
                date: new Date("2011-09-09 23:36:00 UTC"),
                credentialScope: 'us-east-1/host/aws4_request',
                apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
            });
            var stringToSign = "AWS4-HMAC-SHA256\n20110909T233600Z\n20110909/us-east-1/host/aws4_request\n366b91fb121d72a00f46bbe8d395f53a102b06dfb7e79636515208ed3fa606b1";
            var signingKey = signer.calculateSigningKey();
            var signature = signer.calculateSignature(stringToSign, signingKey);
            expect(signature).toBe('b27ccfbfa7df52a200ff74193ca6e32d4b48b8856fab7ebf1c595d0670a7e470');
        });
    });
});
