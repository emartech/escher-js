'use strict';

var Canonicalizer = require('./canonicalizer');
var utils = require('./utils');

var Signer = function(config) {

  function getStringToSign(requestOptions, body, headersToSign) {
    return [
      config.algoPrefix + '-HMAC-' + config.hashAlgo,
      utils.toLongDate(config.date),
      utils.toShortDate(config.date) + '/' + config.credentialScope,
      utils.hash(config.hashAlgo, new Canonicalizer(config.hashAlgo).canonicalizeRequest(
        requestOptions, body, headersToSign))
    ].join('\n');
  }

  function calculateSigningKey() {

    if (typeof config.apiSecret !== 'string') {
      throw new Error('Invalid Escher key');
    }

    var signingKey = config.algoPrefix + config.apiSecret;
    var authKeyParts = [utils.toShortDate(config.date)].concat(config.credentialScope.split(/\//g));
    authKeyParts.forEach(function(data) {
      signingKey = utils.hmac(config.hashAlgo, signingKey, data, false);
    });

    return signingKey;
  }

  function calculateSignature(stringToSign, signingKey) {
    return utils.hmac(config.hashAlgo, signingKey, stringToSign, true);
  }

  return {
    getStringToSign: getStringToSign,
    calculateSigningKey: calculateSigningKey,
    calculateSignature: calculateSignature
  };

};

module.exports = Signer;
