"use strict";

var Signer = require('./signer'),
    AuthHeaderBuilder = require('./authheaderbuilder');

var Escher = function (optionsToMerge) {
    var options = {
        authHeaderName: 'Authorization',
        dateHeaderName: 'Date',
        hashAlgo: "sha256",
        date: new Date(),
        algoPrefix: 'AWS4',
        credentialScope: 'us-east-1/host/aws4_request'
    };
    if (optionsToMerge) {
        Object.keys(optionsToMerge).forEach(function (key) {
            options[key] = optionsToMerge[key];
        });
    }

    function signRequest(requestOptions, body) {
        requestOptions.headers.push(['Authorization', new AuthHeaderBuilder().build(requestOptions, body, options)]);
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
        var requestDate = getHeader(headers, options.dateHeaderName);
        var authHeader = getHeader(headers, options.authHeaderName);
        var regex = new RegExp(options.algoPrefix.toUpperCase() + "-HMAC-([A-Z0-9\\,]+) Credential=([A-Za-z0-9\\-_]+)\/([0-9]{8})\/([A-Za-z0-9\\-_\/]+), SignedHeaders=([A-Za-z\\-;]+), Signature=([0-9a-f]+)$");
        var m = authHeader.match(regex);

        var signerOptions = options;
        signerOptions.date = new Date(requestDate);
        signerOptions.hashAlgo = m[1].toLowerCase();
        signerOptions.credentialScope = m[4];
        signerOptions.apiSecret = keyDB(m[2]);

        var signedHeaders = m[5].split(';');
        var onlyTheSignedHeaders = function (header) {
            return signedHeaders.indexOf(header[0].toLowerCase()) !== -1;
        };
        var byLowerCaseHeaderKeys = function (header1, header2) {
            return header1[0].toLowerCase().localeCompare(header2[0].toLowerCase());
        };
        requestOptions.headers = requestOptions.headers.filter(onlyTheSignedHeaders).sort(byLowerCaseHeaderKeys);
        var signer = new Signer(signerOptions);
        var stringToSign = signer.getStringToSign(requestOptions, requestBody);
        var signingKey = signer.calculateSigningKey();
        var expectedSignature = m[6];
        var actualSignature = signer.calculateSignature(stringToSign, signingKey);
        return expectedSignature === actualSignature;
    }

    return {
        validateRequest: validateRequest,
        preSignUrl: preSignUrl,
        signRequest: signRequest
    };
};

module.exports = Escher;
