"use strict";

var Canonicalizer = require('../lib/canonicalizer'),
    _ = require('underscore')._,
    escherUtil = require('../lib/escherutil');

var Signer = function () {
    function getKeyParts(signerOptions) {
        return [escherUtil.toShortDate(signerOptions.date)].concat(signerOptions.credentialScope.split(/\//g));
    }

    function addDefaultSignerOptions(signerOptions) {
        return _.defaults(signerOptions || {}, {
            hashAlgo: "sha256",
            date: new Date(),
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request'
        });
    }

    function getStringToSign(requestOptions, body, signerOptions) {
        signerOptions = addDefaultSignerOptions(signerOptions);

        return [
            signerOptions.algoPrefix.toUpperCase() + '-HMAC-' + signerOptions.hashAlgo.toUpperCase(),
            escherUtil.toLongDate(signerOptions.date),
            escherUtil.toShortDate(signerOptions.date) + '/' + signerOptions.credentialScope,
            escherUtil.hash(signerOptions.hashAlgo, new Canonicalizer().canonicalizeRequest(requestOptions, body))
        ].join("\n");
    }

    function calculateSigningKey(signerOptions) {
        signerOptions = addDefaultSignerOptions(signerOptions);

        var signingKey = signerOptions.algoPrefix + signerOptions.apiSecret;

        getKeyParts(signerOptions).forEach(function(data) {
            signingKey = escherUtil.hmac(signerOptions.hashAlgo, signingKey, data, false);
        });

        return signingKey;
    }

    function calculateSignature(stringToSign, signingKey, signerOptions) {
        signerOptions = addDefaultSignerOptions(signerOptions);
        return escherUtil.hmac(signerOptions.hashAlgo, signingKey, stringToSign, true);
    }

    return {
        getStringToSign: getStringToSign,
        calculateSigningKey: calculateSigningKey,
        calculateSignature: calculateSignature
    };

};

module.exports = Signer;
