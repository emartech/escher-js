"use strict";

var Escher = require('../lib/escher'),
    AuthHelper = require('../lib/authhelper'),
    testConfig = require('./test_config'),
    specHelper = require('./spec_helper'),
    escherUtil = require('../lib/escherutil'),
    using = specHelper.using,
    TestFileParser = specHelper.TestFileParser,
    readTestFile = specHelper.readTestFile;

describe('Escher', function () {
    var goodDate = 'Fri, 09 Sep 2011 23:36:00 GMT';

    function defaultConfig() {
        return {
            authHeaderName: 'Authorization',
            dateHeaderName: 'Date',
            hashAlgo: "sha256",
            date: goodDate,
            vendorPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request',
            accessKeyId: 'AKIDEXAMPLE',
            apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
        };
    }

    function goodAuthHeader() {
        var config = defaultConfig();
        return new AuthHelper(config).buildHeader({
            shortDate: escherUtil.toShortDate(goodDate),
            signedHeaders: ['date', 'host'],
            signature: '0a71dc54017d377751d56ae400f22f34f5802df5f2162a7261375a34686501be'
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
                        url: testFileParser.getUri(),
                        headers: headers
                    };
                    var config = testConfig[testSuite].config;
                    config.date = testFileParser.getDate(headers);

                    var signedRequestOptions = new Escher(config).signRequest(requestOptions, body, testFileParser.getHeadersToSign());

                    testFileParser = new TestFileParser(readTestFile(testSuite, testFile, 'sreq'));
                    expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                        .toBe(JSON.stringify(escherUtil.normalizeHeaders(testFileParser.getHeaders())));
                });
            });
        });

        it('should automagically add the host and date header to the headers to sign', function() {
            var requestOptions = {
                method: 'GET',
                url: '/',
                headers: [],
                host: 'host.foo.com'
            };

            var signedRequestOptions = new Escher(defaultConfig()).signRequest(requestOptions, '');

            var expectedHeaders = [
                ['date', 'Fri, 09 Sep 2011 23:36:00 GMT'],
                ['host', 'host.foo.com'],
                ['authorization', goodAuthHeader()]
            ];
            expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                .toBe(JSON.stringify(escherUtil.normalizeHeaders(expectedHeaders)));
        });

        it('should use the specified auth header name', function() {
            var requestOptions = {
                method: 'GET',
                url: '/',
                headers: [],
                host: 'host.foo.com'
            };
            var config = defaultConfig();
            config.authHeaderName = 'X-Ems-Auth';
            var signedRequestOptions = new Escher(config).signRequest(requestOptions, '');

            var expectedHeaders = [
                ['date', 'Fri, 09 Sep 2011 23:36:00 GMT'],
                ['host', 'host.foo.com'],
                ['x-ems-auth', goodAuthHeader()]
            ];
            expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                .toBe(JSON.stringify(escherUtil.normalizeHeaders(expectedHeaders)));
        });

        it('should use the specified date header name and format its value', function() {
            var requestOptions = {
                method: 'POST',
                url: '/',
                headers: [
                    ['Content-Type', 'application/x-www-form-urlencoded; charset=utf-8']
                ],
                host: 'iam.amazonaws.com'
            };
            var config = {
                authHeaderName: 'X-Ems-Auth',
                dateHeaderName: 'X-Ems-Date',
                hashAlgo: "sha256",
                date: new Date('Fri, 09 Sep 2011 23:36:00 GMT'),
                vendorPrefix: 'EMS',
                credentialScope: 'us-east-1/iam/aws4_request',
                accessKeyId: 'AKIDEXAMPLE',
                apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
            };
            var signedRequestOptions = new Escher(config).signRequest(requestOptions, 'Action=ListUsers&Version=2010-05-08', ['content-type']);

            var expectedHeaders = [
                ['content-type', 'application/x-www-form-urlencoded; charset=utf-8'],
                ['host', 'iam.amazonaws.com'],
                ['x-ems-date', '20110909T233600Z'],
                ['x-ems-auth', 'EMS-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-ems-date, Signature=f36c21c6e16a71a6e8dc56673ad6354aeef49c577a22fd58a190b5fcf8891dbd']
            ];
            expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                .toBe(JSON.stringify(escherUtil.normalizeHeaders(expectedHeaders)));
        });

        it('should only sign the specified headers', function() {
            var requestOptions = {
                method: 'POST',
                url: '/',
                headers: [
                    ['Content-Type', 'application/x-www-form-urlencoded; charset=utf-8'],
                    ['x-a-header', 'that/should/not/be/signed']
                ],
                host: 'iam.amazonaws.com'
            };
            var config = {
                authHeaderName: 'X-Ems-Auth',
                dateHeaderName: 'X-Ems-Date',
                hashAlgo: "sha256",
                date: new Date('Fri, 09 Sep 2011 23:36:00 GMT'),
                vendorPrefix: 'EMS',
                credentialScope: 'us-east-1/iam/aws4_request',
                accessKeyId: 'AKIDEXAMPLE',
                apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'
            };
            var headersToSign = ['content-type', 'host', 'x-ems-date'];
            var signedRequestOptions = new Escher(config).signRequest(requestOptions, 'Action=ListUsers&Version=2010-05-08', headersToSign);

            var expectedHeaders = [
                ['content-type', 'application/x-www-form-urlencoded; charset=utf-8'],
                ['host', 'iam.amazonaws.com'],
                ['x-a-header', 'that/should/not/be/signed'],
                ['x-ems-date', '20110909T233600Z'],
                ['x-ems-auth', 'EMS-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-ems-date, Signature=f36c21c6e16a71a6e8dc56673ad6354aeef49c577a22fd58a190b5fcf8891dbd']
            ];
            expect(JSON.stringify(escherUtil.normalizeHeaders(signedRequestOptions.headers)))
                .toBe(JSON.stringify(escherUtil.normalizeHeaders(expectedHeaders)));
        });
    });

    describe('preSignUrl', function () {

        var config = {
            date: new Date('2011-05-11T12:00:00Z'),
            hashAlgo: "sha256",
            vendorPrefix: 'EMS',
            vendorKey: 'EMS',
            credentialScope: 'us-east-1/host/aws4_request',
            accessKeyId: 'th3K3y',
            apiSecret: 'very_secure'
        };

        it('should generate signed url', function () {
            var url = 'https://example.com/something?foo=bar&baz=barbaz';

            var signedUrl = new Escher(config).preSignUrl(url, 123456);

            var expectedAuthQueryParams = [
                'X-EMS-Algorithm=EMS-HMAC-SHA256',
                'X-EMS-Credentials=th3K3y%2F20110511%2Fus-east-1%2Fhost%2Faws4_request',
                'X-EMS-Date=20110511T120000Z',
                'X-EMS-Expires=123456',
                'X-EMS-SignedHeaders=host',
                'X-EMS-Signature=fbc9dbb91670e84d04ad2ae7505f4f52ab3ff9e192b8233feeae57e9022c2b67'
            ];

            expect(signedUrl).toBe(url + '&' + expectedAuthQueryParams.join('&'));
        });
    });

    describe('validateRequest', function () {
        var nearToGoodDate = 'Fri, 09 Sep 2011 23:38:00 GMT';
        var currentDate = new Date(nearToGoodDate);

        function requestOptionsWithHeaders(headers) {
            var hostKey = 'Host';
            return {
                method: 'GET',
                url: '/',
                headers: headers,
                host: headers[hostKey],
                body: ''
            };
        }

        function configForHeaderValidationWith(date) {
            return {
                authHeaderName: 'Authorization',
                dateHeaderName: 'Date',
                vendorPrefix: 'AWS4',
                credentialScope: 'us-east-1/host/aws4_request',
                date: date
            };
        }

        function requestOptionsWithQueryString(queryString) {
            return {
                method: 'GET',
                url: '/something' + queryString,
                headers: [
                    ['Host', 'example.com'],
                    ['Content-Type', 'application/x-www-form-urlencoded; charset=utf-8']
                ],
                host: 'example.com',
                body: ''
            };
        }

        function configForQueryStringValidation() {
            return {
                vendorPrefix: 'EMS',
                vendorKey: 'EMS',
                date: '2011/05/11 12:00:00',
                credentialScope: 'us-east-1/host/aws4_request'
            };
        }

        var keyDB = specHelper.createKeyDb({
            'AKIDEXAMPLE': 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
            'th3K3y': 'very_secure'
        });

        it('should validate request using query string', function () {
            var escherConfig = configForQueryStringValidation();
            var requestOptions = requestOptionsWithQueryString('?foo=bar&baz=barbaz&X-EMS-Algorithm=EMS-HMAC-SHA256&X-EMS-Credentials=th3K3y%2F20110511%2Fus-east-1%2Fhost%2Faws4_request&X-EMS-Date=20110511T120000Z&X-EMS-Expires=123456&X-EMS-SignedHeaders=host&X-EMS-Signature=fbc9dbb91670e84d04ad2ae7505f4f52ab3ff9e192b8233feeae57e9022c2b67');

            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); }).not.toThrow();
        });

        it('should validate request using auth header', function () {
            var headers = [
                ['Date', goodDate],
                ['Host', 'host.foo.com'],
                ['Authorization', goodAuthHeader()]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);

            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); }).not.toThrow();
        });

        it('should not depend on the order of headers', function () {
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', goodAuthHeader()]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);

            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); }).not.toThrow();
        });

        it('should check the signature', function () {
            var config = defaultConfig();
            var authHeader = new AuthHelper(config).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signedHeaders: ['date', 'host'],
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The signatures do not match');
        });

        it('should fail if it cannot parse the header', function () {
            var authHeader = "UNPARSABLE";

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('Could not parse auth header');
        });

        it('should detect if dates are not on the same day', function () {
            var twoDaysBeforeGoodDate = 'Sat, 07 Sep 2011 23:36:00 GMT';
            var authHeader = goodAuthHeader();
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', twoDaysBeforeGoodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The credential date does not match with the request date');
        });

        it('should detect if date is not within the 15 minutes range', function () {
            var twoHoursBeforeGoodDate = 'Fri, 09 Sep 2011 21:36:00 GMT';
            var authHeader = goodAuthHeader();
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', twoHoursBeforeGoodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The request date is not within the accepted time range');
        });

        it('should detect missing date header', function () {
            var authHeader = goodAuthHeader();
            var headers = [
                ['Host', 'host.foo.com'],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The date header is missing');
        });

        it('should detect missing auth header', function () {
            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The authorization header is missing');
        });

        // Can we expect all the actual headers, or the host separated from them?
        it('should detect missing host header', function () {
            var authHeader = goodAuthHeader();
            var headers = [
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The host header is missing');
        });

        it('should check whether the date header has been signed', function () {
            var config = defaultConfig();
            var authHeader = new AuthHelper(config).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signedHeaders: ['host'],
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The date header is not signed');
        });

        it('should check whether the host header has been signed', function () {
            var config = defaultConfig();
            var authHeader = new AuthHelper(config).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signedHeaders: ['date'],
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The host header is not signed');
        });

        it('should check the hash algorithm', function () {
            var config = escherUtil.mergeOptions(defaultConfig(), {hashAlgo: 'sha999'});
            var authHeader = new AuthHelper(config).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signedHeaders: ['host', 'date'],
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('Only SHA256 and SHA512 hash algorithms are allowed');
        });

        it('should check the credential scope', function () {
            var config = escherUtil.mergeOptions(defaultConfig(), {credentialScope: 'INVALID'});
            var authHeader = new AuthHelper(config).buildHeader({
                shortDate: escherUtil.toShortDate(goodDate),
                signedHeaders: ['host', 'date'],
                signature: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
            });

            var headers = [
                ['Host', 'host.foo.com'],
                ['Date', goodDate],
                ['Authorization', authHeader]
            ];
            var escherConfig = configForHeaderValidationWith(goodDate);
            var requestOptions = requestOptionsWithHeaders(headers);
            expect(function () { new Escher(escherConfig).validateRequest(requestOptions, keyDB, currentDate); })
                .toThrow('The credential scope is invalid');
        });
    });
});
