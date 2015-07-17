'use strict';

var path = require('path');
var utils = require('./utils');

var Canonicalizer = function(hashAlgo) {
  // node 0.11 urlencodes caret as %5E
  var haveToFixCaretAtUrlParser = utils.parseUrl('^').href !== '^';

  // PRIVATE METHODS

  function canonicalizeHeaders(headers) {
    return Object.keys(headers).map(function(key) {
      return key + ':' + headers[key];
    });
  }

  function canonicalizeQuery(query) {
    function join(key, value) {
      if (haveToFixCaretAtUrlParser) {
        key = key.replace('%5E', '^');
        value = value.replace('%5E', '^');
      }

      return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }

    return Object.keys(query).map(function(key) {
      var value = query[key];
      if (typeof value === 'string') {
        return join(key, value);
      } else {
        return value.sort().map(function(oneValue) {
          return join(key, oneValue);
        }).join('&');
      }
    }).sort().join('&');
  }

  function prepareUri(uri) {
    // https://github.com/joyent/node/blob/4b59db008cec1bfcca2783f4b27c630c9c3fdd73/lib/url.js#L113-L117
    return uri.replace('#', '%23').replace('\\', '%5C');
  }

  function filterHeaders(headers, headersToSign) {
    var filteredHeaders = {};
    var normalizedSignedHeaders = headersToSign
      .map(Function.prototype.call, String.prototype.toLowerCase);

    Object.keys(headers).forEach(function(headerName) {
      if (normalizedSignedHeaders.indexOf(headerName) !== -1) {
        filteredHeaders[headerName] = headers[headerName];
      }
    });

    return filteredHeaders;
  }

  // PUBLIC METHODS

  function canonicalizeRequest(requestOptions, body, headersToSign) {
    var parsedUrl = utils.parseUrl(prepareUri(requestOptions.url), true);
    var headers = filterHeaders(utils.normalizeHeaders(requestOptions.headers), headersToSign);
    var lines = [
      requestOptions.method,
      path.normalize(parsedUrl.pathname),
      canonicalizeQuery(parsedUrl.query),
      canonicalizeHeaders(headers).join('\n'),
      '',
      Object.keys(headers).join(';'),
      utils.hash(hashAlgo, body)
    ];
    return lines.join('\n');
  }

  function getCanonicalizedSignedHeaders(headers, headersToSign) {
    var normalizedHeaders = filterHeaders(utils.normalizeHeaders(headers), headersToSign);
    return Object.keys(normalizedHeaders);
  }

  return {
    canonicalizeQuery: canonicalizeQuery,
    canonicalizeRequest: canonicalizeRequest,
    getCanonicalizedSignedHeaders: getCanonicalizedSignedHeaders
  };

};

module.exports = Canonicalizer;
