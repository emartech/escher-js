'use strict';

var Signer = require('./signer'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var AuthHeaderBuilder = function (signerOptions) {

    function buildAuthParts(requestOptions, body) {
        var signer = new Signer(signerOptions);

        var signature = signer.calculateSignature(signer.getStringToSign(requestOptions, body), signer.calculateSigningKey());
        var signedHeaders = new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions);
        var shortDate = escherUtil.toShortDate(signerOptions.date);

        return {
            signedHeaders: signedHeaders,
            shortDate: shortDate,
            signature: signature
        };
    }

    function buildAuthHeader(requestOptions, body) {
        var authParts = buildAuthParts(requestOptions, body);

        return signerOptions.algoPrefix + '-HMAC-' + signerOptions.hashAlgo.toUpperCase() +
            ' Credential=' + signerOptions.accessKeyId + '/' + authParts.shortDate + '/' + signerOptions.credentialScope +
            ', SignedHeaders=' + authParts.signedHeaders +
            ', Signature=' + authParts.signature;
    }

    return {
        build: buildAuthHeader
    };
};

module.exports = AuthHeaderBuilder;
