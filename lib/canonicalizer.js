'use strict';

const path = require('path').posix;
const Utils = require('./utils');

// node 0.11 urlencodes caret as %5E
const haveToFixCaretAtUrlParser = Utils.parseUrl('^').href !== '^';

class Canonicalizer {

  constructor(hashAlgo) {
    this._hashAlgo = hashAlgo;
  }

  _canonicalizeHeaders(headers) {
    return Object.keys(headers).map(function(key) {
      return key + ':' + headers[key];
    });
  }

  canonicalizeQuery(query) {
    function encodeComponent(component) {
      return encodeURIComponent(component).replace(/\(/g, "%28").replace(/\)/g, "%29");
    }

    function join(key, value) {
      if (haveToFixCaretAtUrlParser) {
        key = key.replace('%5E', '^');
        value = value.replace('%5E', '^');
      }

      return encodeComponent(key) + '=' + encodeComponent(value);
    }

    return Object.keys(query).map(function(key) {
      const value = query[key];
      if (typeof value === 'string') {
        return join(key, value);
      } else {
        return value.sort().map(function(oneValue) {
          return join(key, oneValue);
        }).join('&');
      }
    }).sort().join('&');
  }

  _prepareUri(uri) {
    // https://github.com/joyent/node/blob/4b59db008cec1bfcca2783f4b27c630c9c3fdd73/lib/url.js#L113-L117
    return uri.replace('#', '%23').replace('\\', '%5C');
  }

  _filterHeaders(headers, headersToSign) {
    const filteredHeaders = {};
    const normalizedSignedHeaders = headersToSign
      .map(Function.prototype.call, String.prototype.toLowerCase);

    Object.keys(headers).forEach(function(headerName) {
      if (normalizedSignedHeaders.includes(headerName)) {
        filteredHeaders[headerName] = headers[headerName];
      }
    });

    return filteredHeaders;
  }

  canonicalizeRequest(requestOptions, body, headersToSign) {
    const parsedUrl = Utils.parseUrl(this._prepareUri(requestOptions.url), true);
    const headers = this._filterHeaders(Utils.normalizeHeaders(requestOptions.headers), headersToSign);
    const lines = [
      requestOptions.method,
      path.normalize(parsedUrl.pathname),
      this.canonicalizeQuery(parsedUrl.query),
      this._canonicalizeHeaders(headers).join('\n'),
      '',
      Object.keys(headers).join(';'),
      Utils.hash(this._hashAlgo, body)
    ];
    return lines.join('\n');
  }

  getCanonicalizedSignedHeaders(headers, headersToSign) {
    const normalizedHeaders = this._filterHeaders(Utils.normalizeHeaders(headers), headersToSign);
    return Object.keys(normalizedHeaders);
  }

}

module.exports = Canonicalizer;
