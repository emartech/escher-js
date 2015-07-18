'use strict';

var Escher = require('../lib/escher');
var AuthHelper = require('../lib/authhelper');
var utils = require('../lib/utils');

describe('Escher', function() {
  var goodDate = new Date('Fri, 09 Sep 2011 23:36:00 GMT');
  var nearToGoodDate = new Date('Fri, 09 Sep 2011 23:35:55 GMT');
  var twoHoursBeforeGoodDate = new Date('Fri, 09 Sep 2011 21:36:00 GMT');
  var twoDaysBeforeGoodDate = new Date('Sat, 07 Sep 2011 23:36:00 GMT');
  var dateForPresign = new Date('2011-05-11T12:00:00Z');
  var afterPresignedUrlExpired = new Date('2011-05-30T12:00:00Z');

  function defaultConfig() {
    return {
      vendorKey: 'AWS4',
      algoPrefix: 'AWS4',
      authHeaderName: 'Authorization',
      dateHeaderName: 'Date',
      hashAlgo: 'SHA256',
      date: goodDate,
      credentialScope: 'us-east-1/host/aws4_request',
      accessKeyId: 'AKIDEXAMPLE',
      apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
      clockSkew: 10
    };
  }

  function goodAuthHeader(config, signature) {
    config = utils.mergeOptions(defaultConfig(), config || {});
    return new AuthHelper(config).buildHeader({
      signedHeaders: [config.dateHeaderName.toLowerCase(), 'host'],
      signature: signature || '0a71dc54017d377751d56ae400f22f34f5802df5f2162a7261375a34686501be'
    });
  }

  describe('signRequest', function() {

    it('should use the specified auth header name', function() {
      var requestOptions = {
        method: 'GET',
        url: '/',
        headers: [
          ['Host', 'host.foo.com']
        ]
      };
      var config = defaultConfig();
      config.authHeaderName = 'X-Ems-Auth';
      var signedRequestOptions = new Escher(config).signRequest(requestOptions, '');

      var expectedHeaders = [
        ['date', 'Fri, 09 Sep 2011 23:36:00 GMT'],
        ['host', 'host.foo.com'],
        ['x-ems-auth', goodAuthHeader()]
      ];
      expect(JSON.stringify(utils.normalizeHeaders(signedRequestOptions.headers)))
        .toBe(JSON.stringify(utils.normalizeHeaders(expectedHeaders)));
    });

    it('should use the specified date header name and format its value', function() {
      var requestOptions = {
        method: 'POST',
        url: '/',
        headers: [
          ['Host', 'iam.amazonaws.com'],
          ['Content-Type', 'application/x-www-form-urlencoded; charset=utf-8']
        ]
      };
      var config = {
        vendorKey: 'EMS',
        algoPrefix: 'EMS',
        authHeaderName: 'X-Ems-Auth',
        dateHeaderName: 'X-Ems-Date',
        hashAlgo: 'SHA256',
        date: goodDate,
        credentialScope: 'us-east-1/iam/aws4_request',
        accessKeyId: 'AKIDEXAMPLE',
        apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
        clockSkew: 10
      };
      var signedRequestOptions = new Escher(config).signRequest(requestOptions,
        'Action=ListUsers&Version=2010-05-08', ['content-type']);

      var expectedHeaders = [
        ['content-type', 'application/x-www-form-urlencoded; charset=utf-8'],
        ['host', 'iam.amazonaws.com'],
        ['x-ems-date', '20110909T233600Z'],
        ['x-ems-auth',
          'EMS-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-ems-date, Signature=f36c21c6e16a71a6e8dc56673ad6354aeef49c577a22fd58a190b5fcf8891dbd'
        ]
      ];
      expect(JSON.stringify(utils.normalizeHeaders(signedRequestOptions.headers)))
        .toBe(JSON.stringify(utils.normalizeHeaders(expectedHeaders)));
    });

    it('should only sign the specified headers', function() {
      var requestOptions = {
        method: 'POST',
        url: '/',
        headers: [
          ['Host', 'iam.amazonaws.com'],
          ['Content-Type', 'application/x-www-form-urlencoded; charset=utf-8'],
          ['x-a-header', 'that/should/not/be/signed']
        ]
      };
      var config = {
        vendorKey: 'EMS',
        algoPrefix: 'EMS',
        authHeaderName: 'X-Ems-Auth',
        dateHeaderName: 'X-Ems-Date',
        hashAlgo: 'SHA256',
        date: goodDate,
        credentialScope: 'us-east-1/iam/aws4_request',
        accessKeyId: 'AKIDEXAMPLE',
        apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
        clockSkew: 10
      };
      var headersToSign = ['content-type', 'host', 'x-ems-date'];
      var signedRequestOptions = new Escher(config).signRequest(requestOptions,
        'Action=ListUsers&Version=2010-05-08', headersToSign);

      var expectedHeaders = [
        ['content-type', 'application/x-www-form-urlencoded; charset=utf-8'],
        ['host', 'iam.amazonaws.com'],
        ['x-a-header', 'that/should/not/be/signed'],
        ['x-ems-date', '20110909T233600Z'],
        ['x-ems-auth',
          'EMS-HMAC-SHA256 Credential=AKIDEXAMPLE/20110909/us-east-1/iam/aws4_request, SignedHeaders=content-type;host;x-ems-date, Signature=f36c21c6e16a71a6e8dc56673ad6354aeef49c577a22fd58a190b5fcf8891dbd'
        ]
      ];
      expect(JSON.stringify(utils.normalizeHeaders(signedRequestOptions.headers)))
        .toBe(JSON.stringify(utils.normalizeHeaders(expectedHeaders)));
    });
  });

  describe('authenticate', function() {

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
        vendorKey: 'AWS4',
        algoPrefix: 'AWS4',
        authHeaderName: 'Authorization',
        dateHeaderName: 'Date',
        credentialScope: 'us-east-1/host/aws4_request',
        date: date,
        clockSkew: 10
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

    function configForQueryStringValidation(date) {
      return {
        vendorKey: 'EMS',
        algoPrefix: 'EMS',
        date: date,
        credentialScope: 'us-east-1/host/aws4_request'
      };
    }

    var keyDB = createKeyDb([
      ['AKIDEXAMPLE', 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'],
      ['th3K3y', 'very_secure']
    ]);

    it('should validate request using query string', function() {
      var escherConfig = configForQueryStringValidation(dateForPresign);
      var requestOptions = requestOptionsWithQueryString(
        '?foo=bar&baz=barbaz&X-EMS-Algorithm=EMS-HMAC-SHA256&X-EMS-Credentials=th3K3y%2F20110511%2Fus-east-1%2Fhost%2Faws4_request&X-EMS-Date=20110511T120000Z&X-EMS-Expires=123456&X-EMS-SignedHeaders=host&X-EMS-Signature=fbc9dbb91670e84d04ad2ae7505f4f52ab3ff9e192b8233feeae57e9022c2b67'
      );

      expect(function() {
        new Escher(escherConfig).authenticate(requestOptions, keyDB);
      }).not.toThrow();
    });

    it('should fail if request has expired', function() {
      var escherConfig = configForQueryStringValidation(afterPresignedUrlExpired);
      var requestOptions = requestOptionsWithQueryString(
        '?foo=bar&baz=barbaz&X-EMS-Algorithm=EMS-HMAC-SHA256&X-EMS-Credentials=th3K3y%2F20110511%2Fus-east-1%2Fhost%2Faws4_request&X-EMS-Date=20110511T120000Z&X-EMS-Expires=123456&X-EMS-SignedHeaders=host&X-EMS-Signature=fbc9dbb91670e84d04ad2ae7505f4f52ab3ff9e192b8233feeae57e9022c2b67'
      );

      expect(function() {
          new Escher(escherConfig).authenticate(requestOptions, keyDB);
        })
        .toThrow('The request date is not within the accepted time range');
    });

    it('should not depend on the order of headers', function() {
      var headers = [
        ['Host', 'host.foo.com'],
        ['Date', goodDate.toUTCString()],
        ['Authorization', goodAuthHeader()]
      ];
      var escherConfig = configForHeaderValidationWith(nearToGoodDate);
      var requestOptions = requestOptionsWithHeaders(headers);

      expect(function() {
        new Escher(escherConfig).authenticate(requestOptions, keyDB);
      }).not.toThrow();
    });

    it('should return an instance of Escher after new keyword', function() {
      var escher = new Escher();
      expect(escher instanceof Escher).toEqual(true);
    });
  });
});
