'use strict';

var Signer = require('./signer'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var AuthHeaderBuilder = function (signerConfig) {

    function buildAuthParts(requestOptions, requestBody) {
        var signer = new Signer(signerConfig);

        return {
            shortDate: escherUtil.toShortDate(signerConfig.date),
            signerConfig: signerConfig,
            signedHeaders: new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions),
            signature: signer.calculateSignature(signer.getStringToSign(requestOptions, requestBody), signer.calculateSigningKey())
        };
    }

    function buildHeader(authParts) {
        return authParts.signerConfig.algoPrefix + '-HMAC-' + authParts.signerConfig.hashAlgo.toUpperCase() +
            ' Credential=' + authParts.signerConfig.accessKeyId + '/' + authParts.shortDate + '/' + authParts.signerConfig.credentialScope +
            ', SignedHeaders=' + authParts.signedHeaders.map(Function.prototype.call, String.prototype.toLowerCase).sort().join(';') +
            ', Signature=' + authParts.signature;
    }

    function generateHeader(requestOptions, body) {
        return buildHeader(buildAuthParts(requestOptions, body));
    }

    function parseAuthHeader(authHeader, requestDate, keyDB) {
        var regex = new RegExp(signerConfig.algoPrefix.toUpperCase() + "-HMAC-([A-Z0-9\\,]+) Credential=([A-Za-z0-9\\-_]+)\/([0-9]{8})\/([A-Za-z0-9\\-_\/]+), SignedHeaders=([A-Za-z\\-;]+), Signature=([0-9a-f]+)$");
        var matches = authHeader.match(regex);

        if (!matches) {
            throw new Error('Could not parse auth header!');
        }

        var parsedSignerConfig = {
            algoPrefix: signerConfig.algoPrefix,
            date: requestDate,
            hashAlgo: matches[1].toLowerCase(),
            accessKeyId: matches[2],
            apiSecret: keyDB(matches[2]),
            credentialScope: matches[4]
        };


        return {
            shortDate: matches[3],
            signerConfig: parsedSignerConfig,
            signedHeaders: matches[5].split(';'),
            signature: matches[6]
        };

    }

    return {
        generateHeader: generateHeader,
        buildHeader: buildHeader,
        buildAuthParts: buildAuthParts,
        parseAuthHeader: parseAuthHeader
    };
};

module.exports = AuthHeaderBuilder;
