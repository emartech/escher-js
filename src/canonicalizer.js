'use strict';

const path = require('path').posix;
const Utils = require('./utils');

class Canonicalizer {
  constructor(hashAlgo) {
    this._hashAlgo = hashAlgo;
  }

  _canonicalizeHeaders(headers) {
    return Object.keys(headers).map(key => key + ':' + headers[key]);
  }

  canonicalizeQuery(query) {
    const encodeComponent = component =>
      encodeURIComponent(component)
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29');

    const join = (key, value) => encodeComponent(key) + '=' + encodeComponent(value);

    return Object.keys(query)
      .map(key => {
        const value = query[key];
        if (typeof value === 'string') {
          return join(key, value);
        }
        return value
          .sort()
          .map(oneValue => join(key, oneValue))
          .join('&');
      })
      .sort()
      .join('&');
  }

  _filterHeaders(headers, headersToSign) {
    const filteredHeaders = {};
    const normalizedSignedHeaders = headersToSign.map(header => header.toLowerCase());

    Object.keys(headers).forEach(headerName => {
      if (normalizedSignedHeaders.includes(headerName)) {
        filteredHeaders[headerName] = headers[headerName];
      }
    });

    return filteredHeaders;
  }

  canonicalizeRequest(requestOptions, body, headersToSign) {
    // https://github.com/joyent/node/blob/4b59db008cec1bfcca2783f4b27c630c9c3fdd73/lib/url.js#L113-L117
    const preparedUrl = requestOptions.url.replace('#', '%23').replace('\\', '%5C');
    const parsedUrl = Utils.parseUrl(preparedUrl, true);
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
