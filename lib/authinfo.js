'use strict';

var Signer = require('./signer'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var AuthInfo = function () {

    function buildHeader(requestOptions, body, signerOptions) {
        var signer = new Signer(signerOptions);
        var signature = signer.calculateSignature(signer.getStringToSign(requestOptions, body), signer.calculateSigningKey());
        return signerOptions.algoPrefix + '-HMAC-' + signerOptions.hashAlgo.toUpperCase() +
            ' Credential=' + signerOptions.accessKeyId + '/' + escherUtil.toShortDate(signerOptions.date) + '/' + signerOptions.credentialScope +
            ', SignedHeaders=' + new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions) +
            ', Signature=' + signature;
    }

    return {
        buildHeader: buildHeader
    };
};

module.exports = AuthInfo;
