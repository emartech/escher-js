'use strict';

var Signer = require('./signer'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var AuthHeaderBuilder = function (signerConfig) {

    function buildAuthParts(requestOptions, requestBody) {
        var signer = new Signer(signerConfig);

        return {
            signerConfig: signerConfig,
            signedHeaders: new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions),
            shortDate: escherUtil.toShortDate(signerConfig.date),
            signature: signer.calculateSignature(signer.getStringToSign(requestOptions, requestBody), signer.calculateSigningKey())
        };
    }

    function buildAuthHeader(requestOptions, body) {
        var authParts = buildAuthParts(requestOptions, body);

        return authParts.signerConfig.algoPrefix + '-HMAC-' + authParts.signerConfig.hashAlgo.toUpperCase() +
            ' Credential=' + authParts.signerConfig.accessKeyId + '/' + authParts.shortDate + '/' + authParts.signerConfig.credentialScope +
            ', SignedHeaders=' + authParts.signedHeaders +
            ', Signature=' + authParts.signature;
    }

    function parseAuthHeader(authHeader, requestDate, keyDB) {
        var regex = new RegExp(signerConfig.algoPrefix.toUpperCase() + "-HMAC-([A-Z0-9\\,]+) Credential=([A-Za-z0-9\\-_]+)\/([0-9]{8})\/([A-Za-z0-9\\-_\/]+), SignedHeaders=([A-Za-z\\-;]+), Signature=([0-9a-f]+)$");
        var matches = authHeader.match(regex);

        var parsedSignerConfig = signerConfig;

        parsedSignerConfig.date = new Date(requestDate);
        parsedSignerConfig.hashAlgo = matches[1].toLowerCase();
        parsedSignerConfig.accessKeyId = matches[2];
        parsedSignerConfig.apiSecret = keyDB(matches[2]);
        parsedSignerConfig.credentialScope = matches[4];

        return {
            signerConfig: parsedSignerConfig,
            signedHeaders: matches[5].split(';'),
            shortDate: escherUtil.toShortDate(requestDate),
            signature: matches[6]
        };

    }

    return {
        buildHeader: buildAuthHeader,
        buildAuthParts: buildAuthParts,
        parseAuthHeader: parseAuthHeader
    };
};

module.exports = AuthHeaderBuilder;
