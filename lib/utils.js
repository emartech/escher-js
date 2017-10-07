'use strict';

var crypto = require('crypto');
var url = require('url');
var formatDate = require('dateformat');
var isNumber = require('is-number');
var isString = require('is-string');

var longDateRegExp = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;

function mergeOptions(optionsBase, optionsToMerge) {
  var resultOptions = optionsBase;
  if (optionsToMerge) {
    Object.keys(optionsToMerge).forEach(function(key) {
      resultOptions[key] = optionsToMerge[key];
    });
  }

  return resultOptions;
}

function filterKeysFrom(hash, keysToFilter) {
  var result = {};
  Object.keys(hash).forEach(function(key) {
    if (keysToFilter.indexOf(key) === -1) {
      result[key] = hash[key];
    }
  });

  return result;
}

function isLongDate(date) {
  return longDateRegExp.test(date);
}

function parseLongDate(longDate) {
  var m = longDate.match(longDateRegExp);
  if (!m) {
    throw new Error('Invalid date header, expected format is: 20151104T092022Z');
  }

  return new Date(m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6] + ' GMT');
}

/**
 * Converts a date or a parsable date string to the AWS long date format
 */
function toLongDate(date) {
  return date.toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..*Z/, 'Z');
}

/**
 * Converts a date or a parsable date string to the AWS short date format
 */
function toShortDate(date) {
  return toLongDate(date).substring(0, 8);
}

function hash(hashAlgo, string) {
  return crypto.createHash(hashAlgo).update(string, 'utf8').digest('hex');
}

function hmac(hashAlgo, key, data, isHex) {
  var hmac = crypto.createHmac(hashAlgo, key).update(data, 'utf8');
  return isHex ? hmac.digest('hex') : hmac.digest();
}

function normalizeWhiteSpacesInHeaderValue(value) {
  return value.trim().split('"').map(function(piece, index) {
    var isInsideOfQuotes = (index % 2 === 1);
    return isInsideOfQuotes ? piece : piece.replace(/\s+/, ' ');
  }).join('"');
}

function sortMap(headers) {
  var results = {};
  Object.keys(headers).sort().forEach(function(key) {
    results[key] = headers[key];
  });

  return results;
}

function normalizeHeaders(headers) {
  var results = {};

  function addKeyToResult(key, value) {
    if (!isValidHeaderValue(value)) {
      throw new Error('Header value should be string or number [' + key + ']');
    }

    key = key.toLowerCase().trim();
    value = normalizeWhiteSpacesInHeaderValue(value.toString());
    if (results[key]) {
      results[key] += ',' + value;
    } else {
      results[key] = value;
    }
  }

  if (headers instanceof Array) {
    headers.forEach(function(header) {
      addKeyToResult(header[0], header[1]);
    });
  } else {
    Object.keys(headers).forEach(function(key) {
      addKeyToResult(key, headers[key]);
    });
  }

  return sortMap(results);
}

function isValidHeaderValue(value) {
  return isNumber(value) || isString(value);
}

function parseUrl(urlToParse, parseQueryString, slashesDenoteHost) {
  var parsedUrl = url.parse(urlToParse, parseQueryString, slashesDenoteHost);
  parsedUrl.query = parsedUrl.query || {};
  return parsedUrl;
}

function toHeaderDateFormat(date) {
  return formatDate(date, 'GMT:ddd, dd mmm yyyy HH:MM:ss Z', true);
}

function getHeader(request, headerName) {
  headerName = headerName.toLowerCase();
  if (request.headers instanceof Array) {
    for (var i = 0, j = request.headers.length; i < j; i++) {
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

function addDefaultHeaders(defaultHeaders, requestOptions) {
  Object.keys(defaultHeaders).forEach(function(defaultHeaderKey) {
    var found = false;
    Object.keys(normalizeHeaders(requestOptions.headers)).forEach(function(headerKey) {
      if (headerKey.toLowerCase() === defaultHeaderKey.toLowerCase()) {
        found = true;
      }
    });

    if (!found) {
      requestOptions.headers.push([defaultHeaderKey, defaultHeaders[defaultHeaderKey]]);
    }
  });
}

module.exports = {
  mergeOptions: mergeOptions,
  filterKeysFrom: filterKeysFrom,
  parseLongDate: parseLongDate,
  toLongDate: toLongDate,
  toShortDate: toShortDate,
  hash: hash,
  hmac: hmac,
  normalizeHeaders: normalizeHeaders,
  parseUrl: parseUrl,
  toHeaderDateFormat: toHeaderDateFormat,
  getHeader: getHeader,
  addDefaultHeaders: addDefaultHeaders
};
