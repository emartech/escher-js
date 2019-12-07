'use strict';

const AuthHelper = require('../authhelper');
const Canonicalizer = require('../canonicalizer');
const Utils = require('../utils');

const allowedHashAlgos = ['SHA256', 'SHA512'];
const allowedRequestMethods = ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'PATCH', 'CONNECT'];

class Escher {
  constructor(configToMerge) {
    const config = Utils.mergeOptions(
      {
        algoPrefix: 'ESR',
        vendorKey: 'ESCHER',
        hashAlgo: 'SHA256',
        credentialScope: 'escher_request',
        authHeaderName: 'X-Escher-Auth',
        dateHeaderName: 'X-Escher-Date',
        clockSkew: 300
      },
      configToMerge
    );

    // validate the configuration
    if (typeof config.vendorKey !== 'string' || config.vendorKey !== config.vendorKey.toUpperCase()) {
      throw new Error('Vendor key should be an uppercase string');
    }

    if (typeof config.algoPrefix !== 'string') {
      throw new Error('Algorithm prefix should be a string');
    }

    if (typeof config.hashAlgo !== 'string' || !allowedHashAlgos.includes(config.hashAlgo)) {
      throw new Error('Only SHA256 and SHA512 hash algorithms are allowed');
    }

    this._config = config;
  }

  preSignUrl(url, expires) {
    const currentDate = new Date();
    return new AuthHelper(this._config, currentDate).generatePreSignedUrl(url, expires);
  }

  signRequest(requestOptions, body, headersToSign) {
    const currentDate = new Date();
    this.validateRequest(requestOptions, body);
    headersToSign = ['host', this._config.dateHeaderName.toLowerCase()].concat(headersToSign || []);
    const formattedDate =
      this._config.dateHeaderName.toLowerCase() === 'date'
        ? Utils.toHeaderDateFormat(currentDate)
        : Utils.toLongDate(currentDate);
    const defaultHeaders = Utils.normalizeHeaders([[this._config.dateHeaderName, formattedDate]]);
    Utils.addDefaultHeaders(defaultHeaders, requestOptions);
    requestOptions.headers.push([
      this._config.authHeaderName.toLowerCase(),
      new AuthHelper(this._config, currentDate).generateHeader(requestOptions, body, headersToSign)
    ]);
    return requestOptions;
  }

  authenticate(request, keyDB, mandatorySignedHeaders) {
    const currentDate = new Date();
    this.validateRequest(request);
    this.validateMandatorySignedHeaders(mandatorySignedHeaders);
    const uri = Utils.parseUrl(request.url, true);
    const isPresignedUrl =
      Object.prototype.hasOwnProperty.call(uri.query, this._queryParamKey('Signature')) && request.method === 'GET';

    let requestDate;
    let parsedAuthParts;
    let requestBody;
    let expires;
    if (isPresignedUrl) {
      requestDate = Utils.parseLongDate(uri.query[this._queryParamKey('Date')]);
      parsedAuthParts = new AuthHelper(this._config, currentDate).parseFromQuery(uri.query, requestDate, keyDB);
      requestBody = 'UNSIGNED-PAYLOAD';
      expires = parseInt(uri.query[this._queryParamKey('Expires')]);
      const canonicalizedQueryString = new Canonicalizer().canonicalizeQuery(
        Utils.filterKeysFrom(uri.query, [this._queryParamKey('Signature')])
      );
      request.url = uri.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');
    } else {
      requestDate =
        this._config.dateHeaderName.toLowerCase() === 'date'
          ? new Date(Utils.getHeader(request, this._config.dateHeaderName))
          : Utils.parseLongDate(Utils.getHeader(request, this._config.dateHeaderName));
      parsedAuthParts = new AuthHelper(this._config, currentDate).parseAuthHeader(
        Utils.getHeader(request, this._config.authHeaderName),
        requestDate,
        keyDB
      );
      requestBody = request.body || '';
      expires = 0;
    }

    if (!request.host) {
      request.host = Utils.getHeader(request, 'host');
    }

    if (!mandatorySignedHeaders) {
      mandatorySignedHeaders = [];
    }
    mandatorySignedHeaders.push('host');
    if (!isPresignedUrl) {
      mandatorySignedHeaders.push(this._config.dateHeaderName.toLowerCase());
    }
    mandatorySignedHeaders.forEach(mandatoryHeader => {
      if (!parsedAuthParts.signedHeaders.includes(mandatoryHeader.toLowerCase())) {
        throw new Error('The ' + mandatoryHeader + ' header is not signed');
      }
    });

    if (!Utils.fixedTimeComparison(parsedAuthParts.config.credentialScope, this._config.credentialScope)) {
      throw new Error('Invalid Credential Scope');
    }

    if (!allowedHashAlgos.includes(parsedAuthParts.config.hashAlgo)) {
      throw new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed');
    }

    if (!Utils.fixedTimeComparison(parsedAuthParts.shortDate, Utils.toShortDate(requestDate))) {
      throw new Error('Invalid date in authorization header, it should equal with date header');
    }

    const requestTime = requestDate.getTime();
    const currentTime = currentDate.getTime();
    if (!this._isDateWithinRange(requestTime, currentTime, expires)) {
      throw new Error('The request date is not within the accepted time range');
    }

    const generatedAuthParts = new AuthHelper(parsedAuthParts.config, requestDate).buildAuthParts(
      request,
      requestBody,
      parsedAuthParts.signedHeaders
    );
    if (!Utils.fixedTimeComparison(parsedAuthParts.signature, generatedAuthParts.signature)) {
      throw new Error('The signatures do not match');
    }

    return parsedAuthParts.config.accessKeyId;
  }

  _isDateWithinRange(requestTime, currentTime, expires) {
    return (
      requestTime - this._config.clockSkew * 1000 <= currentTime &&
      currentTime < requestTime + expires * 1000 + this._config.clockSkew * 1000
    );
  }

  _queryParamKey(param) {
    return 'X-' + this._config.vendorKey + '-' + param;
  }

  validateRequest(request, body) {
    if (typeof request.method !== 'string' || !allowedRequestMethods.includes(request.method)) {
      throw new Error('The request method is invalid');
    }

    const reqBody = typeof body !== 'undefined' ? body : request.body;
    if (
      ['POST', 'PUT', 'PATCH'].includes(request.method) &&
      !(typeof reqBody === 'string' || reqBody instanceof Buffer)
    ) {
      throw new Error("The request body shouldn't be empty if the request method is " + request.method);
    }

    if (request.url.indexOf('http://') === 0 || request.url.indexOf('https://') === 0) {
      throw new Error("The request url shouldn't contains http or https");
    }
  }

  validateMandatorySignedHeaders(mandatorySignedHeaders) {
    if (typeof mandatorySignedHeaders === 'undefined') {
      return;
    }
    if (!Array.isArray(mandatorySignedHeaders)) {
      throw new Error('The mandatorySignedHeaders parameter must be undefined or array of strings');
    }
    mandatorySignedHeaders.forEach(mandatorySignedHeader => {
      if (typeof mandatorySignedHeader !== 'string') {
        throw new Error('The mandatorySignedHeaders parameter must be undefined or array of strings');
      }
    });
  }

  static create(configToMerge) {
    return new Escher(configToMerge);
  }
}

module.exports = Escher;
