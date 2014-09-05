"use strict";

var Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var Signer = function (config) {

    function getAuthKeyParts() {
        return [escherUtil.toShortDate(config.date)].concat(config.credentialScope.split(/\//g));
    }

    function getStringToSign(requestOptions, body, headersToSign) {
        return [
            config.vendorPrefix.toUpperCase() + '-HMAC-' + config.hashAlgo.toUpperCase(),
            escherUtil.toLongDate(config.date),
            escherUtil.toShortDate(config.date) + '/' + config.credentialScope,
            escherUtil.hash(config.hashAlgo, new Canonicalizer(config.hashAlgo).canonicalizeRequest(requestOptions, body, headersToSign))
        ].join("\n");
    }

    function calculateSigningKey() {
        // TODO: vendorPrefix is used here as is, but in uppercase above - which is the right solution?
        var signingKey = config.vendorPrefix + config.apiSecret;
        getAuthKeyParts().forEach(function(data) {
            signingKey = escherUtil.hmac(config.hashAlgo, signingKey, data, false);
        });

        return signingKey;
    }

    function calculateSignature(stringToSign, signingKey) {
        return escherUtil.hmac(config.hashAlgo, signingKey, stringToSign, true);
    }

    return {
        getStringToSign: getStringToSign,
        calculateSigningKey: calculateSigningKey,
        calculateSignature: calculateSignature
    };

};

module.exports = Signer;
