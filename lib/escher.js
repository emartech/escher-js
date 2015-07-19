'use strict';

var AuthHelper = require('./authhelper');
var Canonicalizer = require('./canonicalizer');
var utils = require('./utils');

var Escher = function(configToMerge) {

  var config = utils.mergeOptions({
    algoPrefix: 'ESR',
    vendorKey: 'ESCHER',
    hashAlgo: 'SHA256',
    date: new Date(),
    credentialScope: 'escher_request',
    authHeaderName: 'X-Escher-Auth',
    dateHeaderName: 'X-Escher-Date',
    clockSkew: 900
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

  if (!(config.date instanceof Date)) {
    throw new Error('Date should be a JavaScript Date object');
  }

  this._config = config;
};

Escher.prototype = {
  preSignUrl: function(url, expires) {
    return new AuthHelper(this._config).generatePreSignedUrl(url, expires);
  },

  signRequest: function(requestOptions, body, headersToSign) {
    headersToSign = ['host', this._config.dateHeaderName.toLowerCase()].concat(headersToSign || []);
    var formattedDate = (this._config.dateHeaderName.toLowerCase() === 'date' ? utils.toHeaderDateFormat(this._config
      .date) : utils.toLongDate(this._config.date));
    var defaultHeaders = utils.normalizeHeaders([
      [this._config.dateHeaderName, formattedDate]
    ]);
    utils.addDefaultHeaders(defaultHeaders, requestOptions);
    requestOptions.headers.push([this._config.authHeaderName.toLowerCase(), new AuthHelper(this._config).generateHeader(
      requestOptions, body, headersToSign)]);
    return requestOptions;
  },

  authenticate: function(request, keyDB) {
    var uri = utils.parseUrl(request.url, true);
    var isPresignedUrl = uri.query.hasOwnProperty(this._queryParamKey('Signature')) && request.method === 'GET';

    if (isPresignedUrl) {
      var requestDate = utils.parseLongDate(uri.query[this._queryParamKey('Date')]);
      var parsedAuthParts = new AuthHelper(this._config).parseFromQuery(uri.query, requestDate, keyDB);
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
      var parsedAuthParts = new AuthHelper(this._config).parseAuthHeader(utils.getHeader(request, this._config
        .authHeaderName), requestDate, keyDB);
      var requestBody = request.body || '';
      var expires = 0;
    }

    if (!request.host) {
      request.host = utils.getHeader(request, 'host');
    }

    var mandatoryHeaders = isPresignedUrl ? ['host'] : ['host', this._config.dateHeaderName.toLowerCase()];
    mandatoryHeaders.forEach(function(mandatoryHeader) {
      if (parsedAuthParts.signedHeaders.indexOf(mandatoryHeader) === -1) {
        throw new Error('The ' + mandatoryHeader + ' header is not signed');
      }
    });

    if (parsedAuthParts.config.credentialScope !== this._config.credentialScope) {
      throw new Error('The credential scope is invalid');
    }

    if (['SHA256', 'SHA512'].indexOf(parsedAuthParts.config.hashAlgo) === -1) {
      throw new Error('Only SHA256 and SHA512 hash algorithms are allowed');
    }

    if (parsedAuthParts.shortDate !== utils.toShortDate(requestDate)) {
      throw new Error('The credential date does not match with the request date');
    }

    var requestTime = requestDate.getTime();
    var currentTime = this._config.date.getTime();
    if (!this._isDateWithinRange(requestTime, currentTime, expires)) {
      throw new Error('The request date is not within the accepted time range');
    }

    var generatedAuthParts = new AuthHelper(parsedAuthParts.config).buildAuthParts(request, requestBody,
      parsedAuthParts.signedHeaders);
    if (parsedAuthParts.signature !== generatedAuthParts.signature) {
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
  }
};

Escher.create = function(configToMerge) {
  return new Escher(configToMerge);
};

module.exports = Escher;
