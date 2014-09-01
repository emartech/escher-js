'use strict';

var Signer = require('./signer'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var AuthHeaderBuilder = function () {

    function build(requestOptions, body, signerOptions) {
        var signer = new Signer(signerOptions);
        var signature = signer.calculateSignature(signer.getStringToSign(requestOptions, body), signer.calculateSigningKey());
        return 'AWS4-HMAC-SHA256' +
            ' Credential=' + signerOptions.accessKeyId + '/' + escherUtil.toShortDate(signerOptions.date) + '/' + signerOptions.credentialScope +
            ', SignedHeaders=' + new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions) +
            ', Signature=' + signature;
    }

    return {
        build: build
    };
};

module.exports = AuthHeaderBuilder;
