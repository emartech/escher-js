'use strict';

var Canonicalizer = require('./canonicalizer');
var escherUtil = require('./escherutil');

var Signer = function(config) {

  function getStringToSign(requestOptions, body, headersToSign) {
    return [
      config.algoPrefix + '-HMAC-' + config.hashAlgo,
      escherUtil.toLongDate(config.date),
      escherUtil.toShortDate(config.date) + '/' + config.credentialScope,
      escherUtil.hash(config.hashAlgo, new Canonicalizer(config.hashAlgo).canonicalizeRequest(requestOptions, body,
        headersToSign))
    ].join('\n');
  }

  function calculateSigningKey() {
    var signingKey = config.algoPrefix + config.apiSecret;
    var authKeyParts = [escherUtil.toShortDate(config.date)].concat(config.credentialScope.split(/\//g));
    authKeyParts.forEach(function(data) {
      signingKey = escherUtil.hmac(config.hashAlgo, signingKey, data, false);
    });

    return signingKey;
  }

  function calculateSignature(stringToSign, signingKey) {
    return escherUtil.hmac(config.hashAlgo, signingKey, stringToSign, true);
  }

  return {
    getStringToSign: getStringToSign,
    calculateSigningKey: calculateSigningKey,
    calculateSignature: calculateSignature
  };

};

module.exports = Signer;
