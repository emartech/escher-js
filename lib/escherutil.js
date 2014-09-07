"use strict";

var crypto = require('crypto'),
    url = require('url'),
    formatDate = require('dateformat');

function mergeOptions(optionsBase, optionsToMerge) {
    var resultOptions = optionsBase;
    if (optionsToMerge) {
        Object.keys(optionsToMerge).forEach(function(key){
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

/**
 * Converts a date or a parsable date string to the AWS long date format
 */
function toLongDate(date) {
    function isLongDate(date) {
        return (/^\d{8}T\d{6}Z$/).test(date);
    }
    if (isLongDate(date)) {
        return date;
    }
    return new Date(date).toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..*Z/, 'Z');
}

/**
 * Converts a date or a parsable date string to the AWS short date format
 */
function toShortDate(date) {
    return toLongDate(date).substring(0, 8);
}

function hash(hashAlgo, string) {
    return crypto.createHash(hashAlgo).update(string).digest('hex');
}

function hmac(hashAlgo, key, data, isHex) {
    return crypto.createHmac(hashAlgo, key).update(data).digest(isHex ? 'hex' : 'binary');
}

function byLowerCaseHeaderKeys(header1, header2) {
    return header1[0].toLowerCase().localeCompare(header2[0].toLowerCase());
}

function normalizeWhiteSpacesInHeaderValue(value) {
    return value.trim().split('"').map(function (piece, index) {
        var isInsideOfQuotes = (index % 2 === 1);
        return isInsideOfQuotes ? piece : piece.replace(/\s+/, ' ');
    }).join('"');
}

function sortMap(headers) {
    var results = {};
    Object.keys(headers).sort().forEach(function (key) {results[key] = headers[key]; });
    return results;
}

function normalizeHeaders(headers) {
    var results = {};
    function addKeyToResult(key, value) {
        key = key.toLowerCase().trim();
        value = normalizeWhiteSpacesInHeaderValue(value);
        if (results[key]) {
            results[key] += ',' + value;
        } else {
            results[key] = value;
        }
    }
    if (headers instanceof Array) {
        headers.forEach(function(header){ addKeyToResult(header[0], header[1]); });
    } else {
        Object.keys(headers).forEach(function(key){ addKeyToResult(key, headers[key]); });
    }
    return sortMap(results);
}

// TODO: we should use url.parse, not parseUrl
function parseUrl(urlToParse, parseQueryString, slashesDenoteHost) {
    return url.parse(urlToParse, parseQueryString, slashesDenoteHost);
}

function toHeaderDateFormat(date) {
    return formatDate(date, 'ddd, dd mmm yyyy HH:MM:ss "GMT"', true);
}

function regexpQuote(str) {
    return (str+'').replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1");
}

module.exports = {
    mergeOptions: mergeOptions,
    filterKeysFrom: filterKeysFrom,
    toLongDate: toLongDate,
    toShortDate: toShortDate,
    hash: hash,
    hmac: hmac,
    normalizeHeaders: normalizeHeaders,
    byLowerCaseHeaderKeys: byLowerCaseHeaderKeys,
    parseUrl: parseUrl,
    toHeaderDateFormat: toHeaderDateFormat,
    regexpQuote: regexpQuote
};
