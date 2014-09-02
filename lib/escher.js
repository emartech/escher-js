"use strict";

var Signer = require('./signer'),
    AuthHeaderBuilder = require('./authheaderbuilder'),
    escherUtil = require('./escherutil');

var Escher = function (signerConfigToMerge) {
    var signerConfig = addDefaultsToSignerConfig();

    var byLowerCaseHeaderKeys = function (header1, header2) {
        return header1[0].toLowerCase().localeCompare(header2[0].toLowerCase());
    };

    function addDefaultsToSignerConfig() {
        var signerConfig = {
            authHeaderName: 'Authorization',
            dateHeaderName: 'Date',
            hashAlgo: "sha256",
            date: escherUtil.toLongDate(new Date()),
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request'
        };
        if (signerConfigToMerge) {
            Object.keys(signerConfigToMerge).forEach(function (key) {
                signerConfig[key] = signerConfigToMerge[key];
            });
        }
        return signerConfig;
    }

    function addDefaultHeaders(defaultHeaders, requestOptions) {
        Object.keys(defaultHeaders).forEach(function (defaultHeaderKey) {
            var found = false;
            Object.keys(escherUtil.normalizeHeaders(requestOptions.headers)).forEach(function (headerKey) {
                if (headerKey.toLowerCase() === defaultHeaderKey.toLowerCase()) {
                    found = true;
                }
            });
            if (!found) {
                requestOptions.headers.push([defaultHeaderKey, defaultHeaders[defaultHeaderKey]]);
            }
        });
    }

    function signRequest(requestOptions, body, keyDB) {
        signerConfig.apiSecret = keyDB(signerConfig.accessKeyId);
        var defaultHeaders = escherUtil.normalizeHeaders([
            ['Host', requestOptions.host],
            [signerConfig.dateHeaderName, signerConfig.date]
        ]);
        addDefaultHeaders(defaultHeaders, requestOptions);
        requestOptions.headers.sort(byLowerCaseHeaderKeys);
        requestOptions.headers.push(['Authorization', new AuthHeaderBuilder(signerConfig).build(requestOptions, body)]);
        return requestOptions;
    }

    function preSignUrl() {
        // TODO: implement
    }

    function getHeader(headers, headerName) {
        for (var i = 0, j = headers.length; i < j; i++) {
            if (headers[i][0] === headerName) {
                return headers[i][1];
            }
        }
    }

    function validateRequest(requestOptions, requestBody, keyDB) {
        var headers = requestOptions.headers;
        var requestDate = getHeader(headers, signerConfig.dateHeaderName);
        var authHeader = getHeader(headers, signerConfig.authHeaderName);
        var regex = new RegExp(signerConfig.algoPrefix.toUpperCase() + "-HMAC-([A-Z0-9\\,]+) Credential=([A-Za-z0-9\\-_]+)\/([0-9]{8})\/([A-Za-z0-9\\-_\/]+), SignedHeaders=([A-Za-z\\-;]+), Signature=([0-9a-f]+)$");
        var m = authHeader.match(regex);

        var signerConfigForChecking = signerConfig;
        signerConfigForChecking.date = new Date(requestDate);
        signerConfigForChecking.hashAlgo = m[1].toLowerCase();
        signerConfigForChecking.credentialScope = m[4];
        signerConfigForChecking.apiSecret = keyDB(m[2]);

        var signedHeaders = m[5].split(';');
        var onlyTheSignedHeaders = function (header) {
            return signedHeaders.indexOf(header[0].toLowerCase()) !== -1;
        };
        requestOptions.headers = requestOptions.headers.filter(onlyTheSignedHeaders).sort(byLowerCaseHeaderKeys);

        var signer = new Signer(signerConfigForChecking);
        var stringToSign = signer.getStringToSign(requestOptions, requestBody);
        var signingKey = signer.calculateSigningKey();
        var actualSignature = signer.calculateSignature(stringToSign, signingKey);

        var expectedSignature = m[6];
        if (expectedSignature !== actualSignature) {
            throw new Error('The signatures do not match!');
        }
    }

    return {
        validateRequest: validateRequest,
        preSignUrl: preSignUrl,
        signRequest: signRequest
    };
};

module.exports = Escher;
