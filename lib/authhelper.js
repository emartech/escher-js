'use strict';

var Signer = require('./signer'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var AuthHelper = function (config) {

    function buildAuthParts(requestOptions, requestBody, headersToSign) {
        var signer = new Signer(config);

        return {
            shortDate: escherUtil.toShortDate(config.date),
            signedHeaders: new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers, headersToSign),
            signature: signer.calculateSignature(signer.getStringToSign(requestOptions, requestBody, headersToSign), signer.calculateSigningKey())
        };
    }

    function buildHeader(authParts) {
        return [config.algoPrefix, 'HMAC', config.hashAlgo].join('-') +
            ' Credential=' + generateFullCredentials() +
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
            url: parsedUrl.path,
            headers: [ ['Host', parsedUrl.host] ]
        };

        var headersToSign = ['host'];
        var params = createPreSignParams(expires, requestOptions, headersToSign);

        Object.keys(params).forEach(function (key) {
            requestUrl = appendQueryParamToUrl(requestUrl, getParamKey(key), params[key]);
        });

        requestOptions.url = escherUtil.parseUrl(requestUrl, true).path;
        var signer = new Signer(config);
        var signature = signer.calculateSignature(signer.getStringToSign(requestOptions, 'UNSIGNED-PAYLOAD', headersToSign), signer.calculateSigningKey());
        return  appendQueryParamToUrl(requestUrl, getParamKey('Signature'), signature);
    }

    function createPreSignParams(expires, requestOptions, headersToSign) {
        return {
            Algorithm: [config.algoPrefix, 'HMAC', config.hashAlgo].join('-'),
            Credentials: generateFullCredentials(),
            Date: escherUtil.toLongDate(config.date),
            Expires: expires,
            SignedHeaders: formatSignedHeaders(new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers, headersToSign))
        };
    }

    function getParamKey(paramName) {
        return ['X', config.vendorKey, paramName].join('-');
    }

    function appendQueryParamToUrl(url, key, value) {
        if (url.indexOf('?') !== -1) {
            url = url + '&';
        } else {
            url = url + '?';
        }
        return url + encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }

    function generateFullCredentials() {
        return [config.accessKeyId, escherUtil.toShortDate(config.date), config.credentialScope].join('/');
    }

    function formatSignedHeaders(signedHeaders) {
        return signedHeaders.map(Function.prototype.call, String.prototype.toLowerCase).sort().join(';');
    }

    function algoRegExp() {
        return config.algoPrefix + "-HMAC-([A-Za-z0-9\\,]+)";
    }

    function credentialRegExp() {
        return "([A-Za-z0-9\\-_]+)\/([0-9]{8})\/([A-Za-z0-9\\-_\/]+)";
    }

    function signedHeadersRegExp() {
        return "([A-Za-z\\-;]+)";
    }

    function signatureRegExp() {
        return "([0-9a-f]+)";
    }

    function getQueryPart(query, key) {
        return query['X-' + config.vendorKey + '-' + key] || '';
    }

    function parseAuthHeader(authHeader, requestDate, keyDB) {
        var regex = new RegExp("^" + algoRegExp() + " Credential="+ credentialRegExp() +", SignedHeaders="+signedHeadersRegExp()+", Signature=" + signatureRegExp() + "$");
        var matches = authHeader.match(regex);

        if (!matches) {
            throw new Error('Could not parse auth header');
        }

        var parsedConfig = {
            vendorKey: config.vendorKey,
            algoPrefix: config.algoPrefix,
            date: requestDate,
            hashAlgo: matches[1],
            accessKeyId: matches[2],
            apiSecret: keyDB(matches[2]),
            credentialScope: matches[4]
        };

        return {
            shortDate: matches[3],
            config: parsedConfig,
            signedHeaders: matches[5].split(';'),
            signature: matches[6]
        };
    }

    function parseFromQuery(query, requestDate, keyDB) {
        var credentialParts = getQueryPart(query, 'Credentials').match(new RegExp(credentialRegExp()));
        var parsedConfig = {
            vendorKey: config.vendorKey,
            algoPrefix: config.algoPrefix,
            date: requestDate,
            hashAlgo: getQueryPart(query, 'Algorithm').match(new RegExp(algoRegExp()))[1],
            accessKeyId: credentialParts[1],
            apiSecret: keyDB(credentialParts[1]),
            credentialScope: credentialParts[3]
        };

        return {
            shortDate: credentialParts[2],
            config: parsedConfig,
            signedHeaders: getQueryPart(query, 'SignedHeaders').split(';'),
            signature: getQueryPart(query, 'Signature'),
            expires: getQueryPart(query, 'Expires')
        };
    }

    return {
        generateHeader: generateHeader,
        generatePreSignedUrl: generatePreSignedUrl,
        buildHeader: buildHeader,
        buildAuthParts: buildAuthParts,
        parseAuthHeader: parseAuthHeader,
        parseFromQuery: parseFromQuery
    };
};

module.exports = AuthHelper;
