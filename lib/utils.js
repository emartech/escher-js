'use strict';

const crypto = require('crypto');
const url = require('url');
const formatDate = require('dateformat');
const isNumber = require('is-number');
const isString = require('is-string');

const longDateRegExp = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

class Utils {

  static mergeOptions(optionsBase, optionsToMerge) {
    const resultOptions = optionsBase;
    if (optionsToMerge) {
      Object.keys(optionsToMerge).forEach(key => {
        resultOptions[key] = optionsToMerge[key];
      });
    }

    return resultOptions;
  }

  static filterKeysFrom(hash, keysToFilter) {
    const result = {};
    Object.keys(hash).forEach(key => {
      if (!keysToFilter.includes(key)) {
        result[key] = hash[key];
      }
    });

    return result;
  }

  static parseLongDate(longDate) {
    const m = longDate.match(longDateRegExp);
    if (!m) {
      throw new Error('Invalid date header, expected format is: 20151104T092022Z');
    }

    return new Date(m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6] + ' GMT');
  }

  /**
   * Converts a date or a parsable date string to the AWS long date format
   */
  static toLongDate(date) {
    return date.toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..*Z/, 'Z');
  }

  /**
   * Converts a date or a parsable date string to the AWS short date format
   */
  static toShortDate(date) {
    return Utils.toLongDate(date).substring(0, 8);
  }

  static hash(hashAlgo, string) {
    return crypto.createHash(hashAlgo).update(string, 'utf8').digest('hex');
  }

  static hmac(hashAlgo, key, data, isHex) {
    const hmac = crypto.createHmac(hashAlgo, key).update(data, 'utf8');
    return isHex ? hmac.digest('hex') : hmac.digest();
  }

  static normalizeWhiteSpacesInHeaderValue(value) {
    return value.trim().split('"').map((piece, index) => {
      const isInsideOfQuotes = (index % 2 === 1);
      return isInsideOfQuotes ? piece : piece.replace(/\s+/, ' ');
    }).join('"');
  }

  static sortMap(headers) {
    const results = {};
    Object.keys(headers).sort().forEach(key => {
      results[key] = headers[key];
    });

    return results;
  }

  static normalizeHeaders(headers) {
    const results = {};

    const addKeyToResult = (key, value) => {
      if (!Utils.isValidHeaderValue(value)) {
        throw new Error('Header value should be string or number [' + key + ']');
      }

      key = key.toLowerCase().trim();
      value = Utils.normalizeWhiteSpacesInHeaderValue(value.toString());
      if (results[key]) {
        results[key] += ',' + value;
      } else {
        results[key] = value;
      }
    };

    if (Array.isArray(headers)) {
      headers.forEach(header => addKeyToResult(header[0], header[1]));
    } else {
      Object.keys(headers).forEach(key => addKeyToResult(key, headers[key]));
    }

    return Utils.sortMap(results);
  }

  static isValidHeaderValue(value) {
    return isNumber(value) || isString(value);
  }

  static parseUrl(urlToParse, parseQueryString, slashesDenoteHost) {
    const parsedUrl = url.parse(urlToParse, parseQueryString, slashesDenoteHost);
    parsedUrl.query = parsedUrl.query || {};
    return parsedUrl;
  }

  static toHeaderDateFormat(date) {
    return formatDate(date, 'GMT:ddd, dd mmm yyyy HH:MM:ss Z', true);
  }

  static getHeader(request, headerName) {
    headerName = headerName.toLowerCase();
    if (request.headers instanceof Array) {
      for (let i = 0, j = request.headers.length; i < j; i++) {
        if (request.headers[i][0].toLowerCase() === headerName) {
          return request.headers[i][1];
        }
      }
    } else {
      if (request.headers.hasOwnProperty(headerName)) {
        return request.headers[headerName];
      }
    }

    throw new Error('The ' + headerName + ' header is missing');
  }

  static addDefaultHeaders(defaultHeaders, requestOptions) {
    Object.keys(defaultHeaders).forEach(defaultHeaderKey => {
      let found = false;
      Object.keys(Utils.normalizeHeaders(requestOptions.headers)).forEach(headerKey => {
        if (headerKey.toLowerCase() === defaultHeaderKey.toLowerCase()) {
          found = true;
        }
      });

      if (!found) {
        requestOptions.headers.push([defaultHeaderKey, defaultHeaders[defaultHeaderKey]]);
      }
    });
  }

  static fixedTimeComparison(a, b){
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    }
    catch (err) {
        return false;
    }
  }

  static appendQueryParamToUrl(url, key, value) {
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }

  static formatSignedHeaders(signedHeaders) {
    return signedHeaders.map(signedHeader => signedHeader.toLowerCase()).sort().join(';');
  }

}

module.exports = Utils;
