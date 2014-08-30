"use strict";

var crypto = require('crypto');
function toLongDate(date) {
    return date.toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..*Z/, 'Z');
}

function toShortDate(date) {
    return toLongDate(date).substring(0, 8);
}

function hash(hashAlgo, string) {
    return crypto.createHash(hashAlgo).update(string).digest('hex');
}

function hmac(hashAlgo, key, data, isHex) {
    return crypto.createHmac(hashAlgo, key).update(data).digest(isHex ? 'hex' : 'binary');
}

module.exports = {
    toLongDate: toLongDate,
    toShortDate: toShortDate,
    hash: hash,
    hmac: hmac
};
