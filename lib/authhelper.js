'use strict';

const Signer = require('./signer');
const Canonicalizer = require('./canonicalizer');
const Utils = require('./utils');

class AuthHelper {

  constructor(config, currentDate) {
    this._config = config;
    this._currentDate = currentDate;
  }

  buildAuthParts(requestOptions, requestBody, headersToSign) {
    const signer = new Signer(this._config, this._currentDate);

    return {
      shortDate: Utils.toShortDate(this._currentDate),
      signedHeaders: new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers, headersToSign),
      signature: signer.calculateSignature(signer.getStringToSign(requestOptions, requestBody, headersToSign), signer
        .calculateSigningKey())
    };
  }

  _buildHeader(authParts) {
    return [this._config.algoPrefix, 'HMAC', this._config.hashAlgo].join('-') +
      ' Credential=' + this._generateFullCredentials() +
      ', SignedHeaders=' + this._formatSignedHeaders(authParts.signedHeaders) +
      ', Signature=' + authParts.signature;
  }

  generateHeader(requestOptions, body, headersToSign) {
    return this._buildHeader(this.buildAuthParts(requestOptions, body, headersToSign));
  }

  generatePreSignedUrl(requestUrl, expires) {
    const parsedUrl = Utils.parseUrl(requestUrl, true); // TODO apply fixed parse here too (?)
    const requestOptions = {
      host: parsedUrl.host,
      method: 'GET',
      url: parsedUrl.path,
      headers: [
        ['Host', parsedUrl.host]
      ]
    };

    const headersToSign = ['host'];
    const params = {
      Algorithm: [this._config.algoPrefix, 'HMAC', this._config.hashAlgo].join('-'),
      Credentials: this._generateFullCredentials(),
      Date: Utils.toLongDate(this._currentDate),
      Expires: expires,
      SignedHeaders: this._formatSignedHeaders(new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers,
        headersToSign))
    };

    Object.keys(params).forEach(key => {
      requestUrl = this._appendQueryParamToUrl(requestUrl, this._getParamKey(key), params[key]);
    });

    requestOptions.url = Utils.parseUrl(requestUrl, true).path;
    const signer = new Signer(this._config, this._currentDate);
    const signature = signer.calculateSignature(signer.getStringToSign(requestOptions, 'UNSIGNED-PAYLOAD',
      headersToSign), signer.calculateSigningKey());
    return this._appendQueryParamToUrl(requestUrl, this._getParamKey('Signature'), signature);
  }

  _getParamKey(paramName) {
    return ['X', this._config.vendorKey, paramName].join('-');
  }

  _appendQueryParamToUrl(url, key, value) {
    if (url.indexOf('?') !== -1) {
      url = url + '&';
    } else {
      url = url + '?';
    }

    return url + encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }

  _generateFullCredentials() {
    return [this._config.accessKeyId, Utils.toShortDate(this._currentDate), this._config.credentialScope].join('/');
  }

  _formatSignedHeaders(signedHeaders) {
    return signedHeaders.map(Function.prototype.call, String.prototype.toLowerCase).sort().join(';');
  }

  _algoRegExp() {
    return this._config.algoPrefix + '-HMAC-([A-Za-z0-9\\,]+)';
  }

  _credentialRegExp() {
    return '([A-Za-z0-9\\-_]+)\/([0-9]{8})\/([A-Za-z0-9\\-_ \/]+)';
  }

  _signedHeadersRegExp() {
    return '([A-Za-z\\-;]+)';
  }

  _signatureRegExp() {
    return '([0-9a-f]+)';
  }

  _getQueryPart(query, key) {
    return query['X-' + this._config.vendorKey + '-' + key] || '';
  }

  parseAuthHeader(authHeader, requestDate, keyDB) {
    const regex = new RegExp('^' + this._algoRegExp() + ' Credential=' + this._credentialRegExp() + ', SignedHeaders=' +
      this._signedHeadersRegExp() + ', Signature=' + this._signatureRegExp() + '$'
    );
    const matches = authHeader.match(regex);

    if (!matches) {
      throw new Error('Invalid auth header format');
    }

    const parsedConfig = {
      vendorKey: this._config.vendorKey,
      algoPrefix: this._config.algoPrefix,
      date: requestDate,
      hashAlgo: matches[1],
      accessKeyId: matches[2],
      apiSecret: keyDB(matches[2]),
      credentialScope: matches[4]
    };

    if (typeof parsedConfig.apiSecret !== 'string') {
      throw new Error('Invalid Escher key');
    }

    return {
      shortDate: matches[3],
      config: parsedConfig,
      signedHeaders: matches[5].split(';'),
      signature: matches[6]
    };
  }

  parseFromQuery(query, requestDate, keyDB) {
    const credentialParts = this._getQueryPart(query, 'Credentials').match(new RegExp(this._credentialRegExp()));
    const parsedConfig = {
      vendorKey: this._config.vendorKey,
      algoPrefix: this._config.algoPrefix,
      date: requestDate,
      hashAlgo: this._getQueryPart(query, 'Algorithm').match(new RegExp(this._algoRegExp()))[1],
      accessKeyId: credentialParts[1],
      apiSecret: keyDB(credentialParts[1]),
      credentialScope: credentialParts[3]
    };

    if (typeof parsedConfig.apiSecret !== 'string') {
      throw new Error('Invalid Escher key');
    }

    return {
      shortDate: credentialParts[2],
      config: parsedConfig,
      signedHeaders: this._getQueryPart(query, 'SignedHeaders').split(';'),
      signature: this._getQueryPart(query, 'Signature'),
      expires: this._getQueryPart(query, 'Expires')
    };
  }
}

module.exports = AuthHelper;
