"use strict";

var Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var Signer = function (optionsToMerge) {
    var options = {
        hashAlgo: "sha256",
        date: new Date(),
        algoPrefix: 'AWS4',
        credentialScope: 'us-east-1/host/aws4_request'
    };
    if (optionsToMerge) {
        Object.keys(optionsToMerge).forEach(function(key){
            options[key] = optionsToMerge[key];
        });
    }

    function getAuthKeyParts() {
        return [escherUtil.toShortDate(options.date)].concat(options.credentialScope.split(/\//g));
    }

    function getStringToSign(requestOptions, body) {
        return [
            options.algoPrefix.toUpperCase() + '-HMAC-' + options.hashAlgo.toUpperCase(),
            escherUtil.toLongDate(options.date),
            escherUtil.toShortDate(options.date) + '/' + options.credentialScope,
            escherUtil.hash(options.hashAlgo, new Canonicalizer().canonicalizeRequest(requestOptions, body))
        ].join("\n");
    }

    function calculateSigningKey() {
        var signingKey = options.algoPrefix + options.apiSecret;
        getAuthKeyParts().forEach(function(data) {
            signingKey = escherUtil.hmac(options.hashAlgo, signingKey, data, false);
        });

        return signingKey;
    }

    function calculateSignature(stringToSign, signingKey) {
        return escherUtil.hmac(options.hashAlgo, signingKey, stringToSign, true);
    }

    return {
        getStringToSign: getStringToSign,
        calculateSigningKey: calculateSigningKey,
        calculateSignature: calculateSignature
    };

};

module.exports = Signer;
