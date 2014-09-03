'use strict';

var Signer = require('./signer'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var AuthHeaderBuilder = function (signerConfig) {

    function buildAuthParts(requestOptions, requestBody, headersToSign) {
        var signer = new Signer(signerConfig);

        return {
            shortDate: escherUtil.toShortDate(signerConfig.date),
            signerConfig: signerConfig,
            signedHeaders: new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers, headersToSign),
            signature: signer.calculateSignature(signer.getStringToSign(requestOptions, requestBody, headersToSign), signer.calculateSigningKey())
        };
    }

    function buildHeader(authParts) {
        return authParts.signerConfig.algoPrefix + '-HMAC-' + authParts.signerConfig.hashAlgo.toUpperCase() +
            ' Credential=' + generateFullCredentials(authParts.signerConfig, authParts.shortDate) +
            ', SignedHeaders=' + formatSignedHeaders(authParts.signedHeaders) +
            ', Signature=' + authParts.signature;
    }

    function generateHeader(requestOptions, body, headersToSign) {
        return buildHeader(buildAuthParts(requestOptions, body, headersToSign));
    }

    function generatePreSignedUrl(requestUrl, expires) {
        var parsedUrl = escherUtil.parseUrl(requestUrl, true); // TODO apply fixed parse here too (?)
        var requestOptions = {
            host: parsedUrl.host,
            method: 'GET',
            uri: parsedUrl.path,
            headers: [ ['Host', parsedUrl.host] ]
        };

        var headersToSign = ['host'];
        var params = createPreSignParams(expires, requestOptions, headersToSign);

        Object.keys(params).forEach(function (key) {
            requestUrl = appendQueryParamToUrl(requestUrl, getParamKey(key), params[key]);
        });

        requestOptions.uri = escherUtil.parseUrl(requestUrl, true).path;
        var signer = new Signer(signerConfig);
        var signature = signer.calculateSignature(signer.getStringToSign(requestOptions, 'UNSIGNED-PAYLOAD', headersToSign), signer.calculateSigningKey());
        return  appendQueryParamToUrl(requestUrl, getParamKey('Signature'), signature);
    }

    function createPreSignParams(expires, requestOptions, headersToSign) {
        return {
            Algorithm: [signerConfig.algoPrefix, 'HMAC', signerConfig.hashAlgo.toUpperCase()].join('-'),
            Credentials: generateFullCredentials(signerConfig, escherUtil.toShortDate(signerConfig.date)),
            Date: escherUtil.toLongDate(signerConfig.date),
            Expires: expires,
            SignedHeaders: formatSignedHeaders(new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers, headersToSign))
        };
    }

    function getParamKey(paramName) {
        return ['X', signerConfig.vendorKey, paramName].join('-');
    }

    function appendQueryParamToUrl(url, key, value) {
        if (url.indexOf('?' > -1)) {
            url = url + '&';
        } else {
            url = url + '?';
        }
        return url + encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }

    function generateFullCredentials(signerConfig, shortDate) {
        return [signerConfig.accessKeyId, shortDate, signerConfig.credentialScope].join('/');
    }

    function formatSignedHeaders(signedHeaders) {
        return signedHeaders.map(Function.prototype.call, String.prototype.toLowerCase).sort().join(';');
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
        parseAuthHeader: parseAuthHeader,
        generatePreSignedUrl: generatePreSignedUrl
    };
};

module.exports = AuthHeaderBuilder;
