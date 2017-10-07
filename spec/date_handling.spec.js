'use strict';

var Escher = require('../lib/escher');
var utils = require('../lib/utils');
var querystring = require('querystring');

var configWithoutSpecifiedDate = {
  "accessKeyId": "AKIDEXAMPLE",
  "apiSecret": "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
  "clockSkew": 0
};
var keyDb = function(accessKeyId) {
  return accessKeyId === "AKIDEXAMPLE" ? "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY" : null;
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe('Escher date handling', function() {
  var urlToSign = 'https://example.com/something?foo=bar&baz=barbaz';
  var requestToSign = {
    "method": "GET",
    "url": "/",
    "headers": [ [ "Host", "host.foo.com" ] ]
  };

  beforeEach(function(){
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(Date.UTC(1978, 1, 10, 1, 2, 3)));
  });

  afterEach(function(){
    jasmine.clock().uninstall();
  });

  describe('signRequest', function(){

    it('should use the current date if date is not specified', function() {
      var escher = new Escher(configWithoutSpecifiedDate);

      var signedRequest = escher.signRequest(clone(requestToSign), '');
      var date = utils.getHeader(signedRequest, 'x-escher-date');

      expect(date).toEqual('19780210T010203Z');
    });

    it('should use the current date for each sign', function() {
      var escher = new Escher(configWithoutSpecifiedDate);

      var firstSignedRequest = escher.signRequest(clone(requestToSign), '');
      var firstDate = utils.getHeader(firstSignedRequest, 'x-escher-date');
      jasmine.clock().tick(1000);
      var secondSignedRequest = escher.signRequest(clone(requestToSign), '');
      var secondDate = utils.getHeader(secondSignedRequest, 'x-escher-date');

      expect(firstDate).toEqual('19780210T010203Z');
      expect(secondDate).toEqual('19780210T010204Z');
    });

  });

  describe('presignUrl', function(){

    it('should use the current date if date is not specified', function() {
      var escher = new Escher(configWithoutSpecifiedDate);

      var signedUrl = escher.preSignUrl(urlToSign, 60);
      var query = querystring.parse(utils.parseUrl(signedUrl).query);
      var date = query['X-ESCHER-Date'];

      expect(date).toEqual('19780210T010203Z');
    });

    it('should use the current date for each sign', function() {
      var escher = new Escher(configWithoutSpecifiedDate);

      var firstSignedUrl = escher.preSignUrl(urlToSign, 60);
      var firstQuery = querystring.parse(utils.parseUrl(firstSignedUrl).query);
      var firstDate = firstQuery['X-ESCHER-Date'];
      jasmine.clock().tick(1000);
      var secondSignedUrl = escher.preSignUrl(urlToSign, 60);
      var secondQuery = querystring.parse(utils.parseUrl(secondSignedUrl).query);
      var secondDate = secondQuery['X-ESCHER-Date'];

      expect(firstDate).toEqual('19780210T010203Z');
      expect(secondDate).toEqual('19780210T010204Z');
    });

  });

  describe('authenticate', function(){

    it('should use the current date when method called, not the date of instantiation', function() {
      var escher = new Escher(configWithoutSpecifiedDate);
      jasmine.clock().tick(15 * 60 * 1000);

      var signedUrl = escher.preSignUrl(urlToSign, 1);
      var parsedSignedUrl = utils.parseUrl(signedUrl);

      // should not throw an error
      escher.authenticate({
        "method": "GET",
        "url": parsedSignedUrl.path,
        "headers": [["Host", parsedSignedUrl.host]]
      }, keyDb);

    });

  });
});
