"use strict";

var crypto = require('crypto');

function toLongDate(dateString) {
    return new Date(dateString).toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..*Z/, 'Z');
}

function toShortDate(dateAsString) {
    return toLongDate(dateAsString).substring(0, 8);
}

function hash(hashAlgo, string) {
    return crypto.createHash(hashAlgo).update(string).digest('hex');
}

function hmac(hashAlgo, key, data, isHex) {
    return crypto.createHmac(hashAlgo, key).update(data).digest(isHex ? 'hex' : 'binary');
}

function byLowerCaseHeaderKeys(header1, header2) {
    return header1[0].toLowerCase().localeCompare(header2[0].toLowerCase());
};

function normalizeHeaders(headers) {
    var results = {};
    function addKeyToResult(key, value) {
        key = key.toLowerCase().trim();
        value = value.trim(); // TODO: we should handle qoutes and spaces inside string
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
    return results;
}

module.exports = {
    toLongDate: toLongDate,
    toShortDate: toShortDate,
    hash: hash,
    hmac: hmac,
    normalizeHeaders: normalizeHeaders,
    byLowerCaseHeaderKeys: byLowerCaseHeaderKeys
};
