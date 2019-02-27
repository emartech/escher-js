'use strict';

const Escher = require('../lib/escher');
const Utils = require('../lib/utils');
const querystring = require('querystring');

const configWithoutSpecifiedDate = {
  "accessKeyId": "AKIDEXAMPLE",
  "apiSecret": "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
  "clockSkew": 0
};
const keyDb = function(accessKeyId) {
  return accessKeyId === "AKIDEXAMPLE" ? "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY" : null;
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

describe('Escher date handling', function() {
  const urlToSign = 'https://example.com/something?foo=bar&baz=barbaz';
  const requestToSign = {
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
      const escher = new Escher(configWithoutSpecifiedDate);

      const signedRequest = escher.signRequest(clone(requestToSign), '');
      const date = Utils.getHeader(signedRequest, 'x-escher-date');

      expect(date).toEqual('19780210T010203Z');
    });

    it('should use the current date for each sign', function() {
      const escher = new Escher(configWithoutSpecifiedDate);

      const firstSignedRequest = escher.signRequest(clone(requestToSign), '');
      const firstDate = Utils.getHeader(firstSignedRequest, 'x-escher-date');
      jasmine.clock().tick(1000);
      const secondSignedRequest = escher.signRequest(clone(requestToSign), '');
      const secondDate = Utils.getHeader(secondSignedRequest, 'x-escher-date');

      expect(firstDate).toEqual('19780210T010203Z');
      expect(secondDate).toEqual('19780210T010204Z');
    });

  });

  describe('presignUrl', function(){

    it('should use the current date if date is not specified', function() {
      const escher = new Escher(configWithoutSpecifiedDate);

      const signedUrl = escher.preSignUrl(urlToSign, 60);
      const query = querystring.parse(Utils.parseUrl(signedUrl).query);
      const date = query['X-ESCHER-Date'];

      expect(date).toEqual('19780210T010203Z');
    });

    it('should use the current date for each sign', function() {
      const escher = new Escher(configWithoutSpecifiedDate);

      const firstSignedUrl = escher.preSignUrl(urlToSign, 60);
      const firstQuery = querystring.parse(Utils.parseUrl(firstSignedUrl).query);
      const firstDate = firstQuery['X-ESCHER-Date'];
      jasmine.clock().tick(1000);
      const secondSignedUrl = escher.preSignUrl(urlToSign, 60);
      const secondQuery = querystring.parse(Utils.parseUrl(secondSignedUrl).query);
      const secondDate = secondQuery['X-ESCHER-Date'];

      expect(firstDate).toEqual('19780210T010203Z');
      expect(secondDate).toEqual('19780210T010204Z');
    });

  });

  describe('authenticate', function(){

    it('should use the current date when method called, not the date of instantiation', function() {
      const escher = new Escher(configWithoutSpecifiedDate);
      jasmine.clock().tick(15 * 60 * 1000);

      const signedUrl = escher.preSignUrl(urlToSign, 1);
      const parsedSignedUrl = Utils.parseUrl(signedUrl);

      // should not throw an error
      escher.authenticate({
        "method": "GET",
        "url": parsedSignedUrl.path,
        "headers": [["Host", parsedSignedUrl.host]]
      }, keyDb);

    });

  });
});
