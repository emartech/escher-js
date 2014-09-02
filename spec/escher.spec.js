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
            accessKeyId: 'AKIDEXAMPLE',
            apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
        };
    }

    function goodAuthHeader() {
        var signerConfig = defaultSignerConfig();
        return new AuthHeaderBuilder(signerConfig).buildHeader({
            shortDate: escherUtil.toShortDate(goodDate),
            signerConfig: signerConfig,
            signedHeaders: ['date', 'host'],
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

                    var signedRequestOptions = new Escher(options).signRequest(requestOptions, body);

                    testFileParser = new TestFileParser(readTestFile(testSuite, testFile, 'sreq'));
                    expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                        .toBe(JSON.stringify(escherUtil.normalizeHeaders(testFileParser.getHeaders())));
                });
            });
        });

        it('should automagically add the host and date header to the headers to sign', function() {
            var requestOptions = {
                method: 'GET',
                uri: '/',
                headers: [],
                host: 'host.foo.com'
            };
            var signedRequestOptions = new Escher(defaultSignerConfig()).signRequest(requestOptions, '');

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
        var nearToGoodDate = 'Mon, 09 Sep 2011 23:38:00 GMT';
        var currentDate = new Date(nearToGoodDate);

        function requestOptionsWithHeaders(headers) {
            return {
                method: 'GET',
                uri: '/',
                headers: headers
            };
        }

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

            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); }).not.toThrow();
        });

        it('should not depend on the order of headers', function () {
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', goodAuthHeader()]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);

            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); }).not.toThrow();
        });

        it('should check the signature', function () {
            var signerConfig = defaultSignerConfig();
            var authHeader = new AuthHeaderBuilder(signerConfig).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signerConfig: signerConfig,
                signedHeaders: ['date', 'host'],
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); }).toThrow('The signatures do not match!');
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
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); }).toThrow('Could not parse auth header!');
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
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); })
                .toThrow('The credential date does not match with the request date!');
        });

        it('should detect if date is not within the 15 minutes range', function () {
            var twoHoursBeforeGoodDate = 'Mon, 09 Sep 2011 21:36:00 GMT';
            var authHeader = goodAuthHeader();
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', twoHoursBeforeGoodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); })
                .toThrow('The request date is not within the accepted time range!');
        });

        it('should detect missing date header', function () {
            var authHeader = goodAuthHeader();
            var headers = [
                ['Host', 'host.foo.com'],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); })
                .toThrow('The date header is missing!');
        });

        it('should detect missing auth header', function () {
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); })
                .toThrow('The authorization header is missing!');
        });

        // Can we expect all the actual headers, or the host separated from them?
        it('should detect missing host header', function () {
            var authHeader = goodAuthHeader();
            var headers = [
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); })
                .toThrow('The host header is missing!');
        });

        it('should check whether the date header has been signed', function () {
            var signerConfig = defaultSignerConfig();
            var authHeader = new AuthHeaderBuilder(signerConfig).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signerConfig: signerConfig,
                signedHeaders: ['host'],
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configWithDate(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, '', keyDB, currentDate); }).toThrow('The date header is not signed!');
        });
    });
});
