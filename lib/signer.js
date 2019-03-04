'use strict';

const Canonicalizer = require('./canonicalizer');
const Utils = require('./utils');

class Signer {

  constructor(config, currentDate) {
    this._config = config;
    this._currentDate = currentDate;
  }

  getStringToSign(requestOptions, body, headersToSign) {
    return [
      this._config.algoPrefix + '-HMAC-' + this._config.hashAlgo,
      Utils.toLongDate(this._currentDate),
      Utils.toShortDate(this._currentDate) + '/' + this._config.credentialScope,
      Utils.hash(this._config.hashAlgo, new Canonicalizer(this._config.hashAlgo).canonicalizeRequest(
        requestOptions, body, headersToSign))
    ].join('\n');
  }

  calculateSigningKey() {
    if (typeof this._config.apiSecret !== 'string') {
      throw new Error('Invalid Escher key');
    }

    let signingKey = this._config.algoPrefix + this._config.apiSecret;
    const authKeyParts = [Utils.toShortDate(this._currentDate)].concat(this._config.credentialScope.split(/\//g));
    authKeyParts.forEach(data => {
      signingKey = Utils.hmac(this._config.hashAlgo, signingKey, data, false);
    });

    return signingKey;
  }

  calculateSignature(stringToSign, signingKey) {
    return Utils.hmac(this._config.hashAlgo, signingKey, stringToSign, true);
  }
}

module.exports = Signer;
