"use strict";

var Escher = require('../lib/escher'),
    AuthHeaderBuilder = require('../lib/authheaderbuilder'),
    testConfig = require('./test_config'),
    specHelper = require('./spec_helper'),
    escherUtil = require('../lib/escherutil'),
    using = specHelper.using,
    TestFileParser = specHelper.TestFileParser,
    readTestFile = specHelper.readTestFile;

describe('Escher', function () {
    var goodDate = 'Mon, 09 Sep 2011 23:36:00 GMT';

    function defaultSignerConfig() {
        return {
            authHeaderName: 'Authorization',
            dateHeaderName: 'Date',
            hashAlgo: "sha256",
            date: goodDate,
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request',
            accessKeyId: 'AKIDEXAMPLE'
        };
    }

    function requestOptionsWithHeaders(headers) {
        return {
            method: 'GET',
            host: 'host.foo.com',
            uri: '/',
            headers: headers
        };
    }

    function goodAuthHeader() {
        var signerConfig = defaultSignerConfig();
        return new AuthHeaderBuilder(signerConfig).buildHeader({
            shortDate: escherUtil.toShortDate(goodDate),
            signerConfig: signerConfig,
            signedHeaders: 'date;host',
            signature: 'b27ccfbfa7df52a200ff74193ca6e32d4b48b8856fab7ebf1c595d0670a7e470'
        });
    }

    describe('signRequest', function () {
        Object.keys(testConfig).forEach(function (testSuite) {
            using(testSuite + ' test files', testConfig[testSuite].files, function (testFile) {
                it('should add signature to headers', function () {

                    var testFileParser = new TestFileParser(readTestFile(testSuite, testFile, 'req'));
                    var body = testFileParser.getBody();
                    var headers = testFileParser.getHeaders();

                    var requestOptions = {
                        method: testFileParser.getMethod(),
                        host: testFileParser.getHost(headers),
                        uri: testFileParser.getUri(),
                        headers: headers
                    };
                    var options = testConfig[testSuite].signerConfig;
                    options.date = testFileParser.getDate(headers);
                    var keyDb = specHelper.createKeyDb(options.accessKeyId, options.apiSecret);

                    var apiSecret = options.apiSecret;
                    options.apiSecret = null;

                    var signedRequestOptions = new Escher(options).signRequest(requestOptions, body, keyDb);

                    testFileParser = new TestFileParser(readTestFile(testSuite, testFile, 'sreq'));
                    expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                        .toBe(JSON.stringify(escherUtil.normalizeHeaders(testFileParser.getHeaders())));

                    options.apiSecret = apiSecret;
                });
            });
        });

        it('should automagically add the host and date header to the headers to sign', function() {
            var actualHeaders = [];
            var requestOptions = requestOptionsWithHeaders(actualHeaders);
            var signedRequestOptions = new Escher(defaultSignerConfig()).signRequest(requestOptions, '', specHelper.createKeyDb('AKIDEXAMPLE', 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'));

            var expectedHeaders = [
                ['date', 'Mon, 09 Sep 2011 23:36:00 GMT'],
                ['host', 'host.foo.com'],
                ['authorization', goodAuthHeader()]
            ];
            expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                .toBe(JSON.stringify(escherUtil.normalizeHeaders(expectedHeaders)));
        });
    });

    describe('validateRequest', function () {
        function configWithDate(date) {
            return {
                authHeaderName: 'Authorization',
                dateHeaderName: 'Date',
                algoPrefix: 'AWS4',
                credentialScope: 'us-east-1/host/aws4_request',
                date: date
            };
        }

        var keyDB = specHelper.createKeyDb('AKIDEXAMPLE', 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY');

        it('should validate request using auth header', function () {
            var headers = [
                ['Date', goodDate],
                ['Host', 'host.foo.com'],
                ['Authorization', goodAuthHeader()]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);

            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB); }).not.toThrow();
        });

        it('should not depend on the order of headers', function () {
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', goodAuthHeader()]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);

            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB); }).not.toThrow();
        });

        it('should check the signature', function () {
            var signerConfig = defaultSignerConfig();
            var authHeader = new AuthHeaderBuilder(signerConfig).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signerConfig: signerConfig,
                signedHeaders: 'date;host',
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB); }).toThrow('The signatures do not match!');
        });

        it('should fail if it cannot parse the header', function () {
            var authHeader = "UNPARSABLE";

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB); }).toThrow('Could not parse auth header!');
        });

        it('should detect if dates are not on the same day', function () {
            var twoDaysBeforeGoodDate = 'Sat, 07 Sep 2011 23:36:00 GMT';
            var authHeader = goodAuthHeader();
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', twoDaysBeforeGoodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB); }).toThrow('Invalid request date!');
        });
    });
});
