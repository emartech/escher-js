'use strict';

var AuthHelper = require('./authhelper');
var Canonicalizer = require('./canonicalizer');
var utils = require('./utils');

var Escher = function(configToMerge) {

  var config = utils.mergeOptions({
    algoPrefix: 'ESR',
    vendorKey: 'ESCHER',
    hashAlgo: 'SHA256',
    credentialScope: 'escher_request',
    authHeaderName: 'X-Escher-Auth',
    dateHeaderName: 'X-Escher-Date',
    clockSkew: 300
  }, configToMerge);

  // validate the configuration
  if (typeof config.vendorKey !== 'string' || config.vendorKey !== config.vendorKey.toUpperCase()) {
    throw new Error('Vendor key should be an uppercase string');
  }

  if (typeof config.algoPrefix !== 'string') {
    throw new Error('Algorithm prefix should be a string');
  }

  if (typeof config.hashAlgo !== 'string' || ['SHA256', 'SHA512'].indexOf(config.hashAlgo) === -1) {
    throw new Error('Only SHA256 and SHA512 hash algorithms are allowed');
  }

  this._config = config;
};

Escher.prototype = {
  preSignUrl: function(url, expires) {
    var currentDate = new Date();
    return new AuthHelper(this._config, currentDate).generatePreSignedUrl(url, expires);
  },

  signRequest: function(requestOptions, body, headersToSign) {
    var currentDate = new Date();
    this.validateRequest(requestOptions, body);
    headersToSign = ['host', this._config.dateHeaderName.toLowerCase()].concat(headersToSign || []);
    var formattedDate = (this._config.dateHeaderName.toLowerCase() === 'date' ? utils.toHeaderDateFormat(currentDate) : utils.toLongDate(currentDate));
    var defaultHeaders = utils.normalizeHeaders([
      [this._config.dateHeaderName, formattedDate]
    ]);
    utils.addDefaultHeaders(defaultHeaders, requestOptions);
    requestOptions.headers.push([this._config.authHeaderName.toLowerCase(), new AuthHelper(this._config, currentDate).generateHeader(
      requestOptions, body, headersToSign)]);
    return requestOptions;
  },

  authenticate: function(request, keyDB, mandatorySignedHeaders) {
    var currentDate = new Date();
    this.validateRequest(request);
    this.validateMandatorySignedHeaders(mandatorySignedHeaders);
    var uri = utils.parseUrl(request.url, true);
    var isPresignedUrl = Object.prototype.hasOwnProperty.call(uri.query, this._queryParamKey('Signature')) && request.method === 'GET';

    if (isPresignedUrl) {
      var requestDate = utils.parseLongDate(uri.query[this._queryParamKey('Date')]);
      var parsedAuthParts = new AuthHelper(this._config, currentDate).parseFromQuery(uri.query, requestDate, keyDB);
      var requestBody = 'UNSIGNED-PAYLOAD';
      var expires = parseInt(uri.query[this._queryParamKey('Expires')]);
      var canonicalizedQueryString = new Canonicalizer().canonicalizeQuery(utils.filterKeysFrom(uri.query, [
        this._queryParamKey('Signature')
      ]));
      request.url = uri.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');
    } else {
      var requestDate = this._config.dateHeaderName.toLowerCase() === 'date' ? new Date(utils.getHeader(
        request, this._config.dateHeaderName)) : utils.parseLongDate(utils.getHeader(request, this._config
        .dateHeaderName));
      var parsedAuthParts = new AuthHelper(this._config, currentDate).parseAuthHeader(utils.getHeader(request, this._config
        .authHeaderName), requestDate, keyDB);
      var requestBody = request.body || '';
      var expires = 0;
    }

    if (!request.host) {
      request.host = utils.getHeader(request, 'host');
    }

    if (!mandatorySignedHeaders) {
      mandatorySignedHeaders = [];
    }
    mandatorySignedHeaders.push('host');
    if (!isPresignedUrl) {
      mandatorySignedHeaders.push(this._config.dateHeaderName.toLowerCase());
    }
    mandatorySignedHeaders.forEach(function(mandatoryHeader) {
      if (parsedAuthParts.signedHeaders.indexOf(mandatoryHeader.toLowerCase()) === -1) {
        throw new Error('The ' + mandatoryHeader + ' header is not signed');
      }
    });

    if (!utils.fixedTimeComparison(parsedAuthParts.config.credentialScope, this._config.credentialScope)) {
      throw new Error('Invalid Credential Scope');
    }

    if (['SHA256', 'SHA512'].indexOf(parsedAuthParts.config.hashAlgo) === -1) {
      throw new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed');
    }

    if (!utils.fixedTimeComparison(parsedAuthParts.shortDate, utils.toShortDate(requestDate))) {
      throw new Error('Invalid date in authorization header, it should equal with date header');
    }

    var requestTime = requestDate.getTime();
    var currentTime = currentDate.getTime();
    if (!this._isDateWithinRange(requestTime, currentTime, expires)) {
      throw new Error('The request date is not within the accepted time range');
    }

    var generatedAuthParts = new AuthHelper(parsedAuthParts.config, requestDate).buildAuthParts(request, requestBody,
      parsedAuthParts.signedHeaders);
    if (!utils.fixedTimeComparison(parsedAuthParts.signature, generatedAuthParts.signature)) {
      throw new Error('The signatures do not match');
    }

    return parsedAuthParts.config.accessKeyId;
  },

  _isDateWithinRange: function(requestTime, currentTime, expires) {
    return (requestTime - this._config.clockSkew * 1000 <= currentTime) &&
      (currentTime < requestTime + expires * 1000 + this._config.clockSkew * 1000);
  },

  _queryParamKey: function(param) {
    return 'X-' + this._config.vendorKey + '-' + param;
  },

  validateRequest: function(request, body) {
    if (typeof request.method !== 'string' || ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'PATCH', 'CONNECT'].indexOf(request.method) === -1) {
      throw new Error('The request method is invalid');
    }

    var reqBody = (typeof body != 'undefined') ? body : request.body;
    if (['POST', 'PUT', 'PATCH'].indexOf(request.method) !== -1 &&
      !(typeof reqBody === 'string' || reqBody instanceof Buffer)) {
      throw new Error("The request body shouldn't be empty if the request method is POST");
    }

    if (request.url.indexOf("http://") == 0 || request.url.indexOf("https://") == 0) {
      throw new Error("The request url shouldn't contains http or https");
    }
  },

  validateMandatorySignedHeaders: function(mandatorySignedHeaders) {
    if (typeof mandatorySignedHeaders === 'undefined') return;
    if (!Array.isArray(mandatorySignedHeaders)) {
      throw new Error('The mandatorySignedHeaders parameter must be undefined or array of strings');
    }
    mandatorySignedHeaders.forEach(function(mandatorySignedHeader) {
      if (typeof mandatorySignedHeader !== 'string') {
        throw new Error('The mandatorySignedHeaders parameter must be undefined or array of strings');
      }
    });
  }
};

Escher.create = function(configToMerge) {
  return new Escher(configToMerge);
};

module.exports = Escher;
