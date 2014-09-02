"use strict";

var Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var Signer = function (signerConfigToMerge) {
    var signerConfig = signerConfigToMerge;
    function getAuthKeyParts() {
        return [escherUtil.toShortDate(signerConfig.date)].concat(signerConfig.credentialScope.split(/\//g));
    }

    function getStringToSign(requestOptions, body) {
        return [
            signerConfig.algoPrefix.toUpperCase() + '-HMAC-' + signerConfig.hashAlgo.toUpperCase(),
            escherUtil.toLongDate(signerConfig.date),
            escherUtil.toShortDate(signerConfig.date) + '/' + signerConfig.credentialScope,
            escherUtil.hash(signerConfig.hashAlgo, new Canonicalizer().canonicalizeRequest(requestOptions, body))
        ].join("\n");
    }

    function calculateSigningKey() {
        var signingKey = signerConfig.algoPrefix + signerConfig.apiSecret;
        getAuthKeyParts().forEach(function(data) {
            signingKey = escherUtil.hmac(signerConfig.hashAlgo, signingKey, data, false);
        });

        return signingKey;
    }

    function calculateSignature(stringToSign, signingKey) {
        return escherUtil.hmac(signerConfig.hashAlgo, signingKey, stringToSign, true);
    }

    return {
        getStringToSign: getStringToSign,
        calculateSigningKey: calculateSigningKey,
        calculateSignature: calculateSignature
    };

};

module.exports = Signer;
