"use strict";

var AuthHeaderBuilder = require('./authheaderbuilder'),
    escherUtil = require('./escherutil');

var Escher = function (signerConfigToMerge) {
    var FIFTEEN_MINUTES_IN_MILLISEC = 900000;
    var signerConfig = addDefaultsToSignerConfig();

    function addDefaultsToSignerConfig() {
        var signerConfig = {
            authHeaderName: 'Authorization',
            dateHeaderName: 'Date',
            hashAlgo: "sha256",
            date: escherUtil.toLongDate(new Date()),
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request'
        };
        return escherUtil.mergeOptions(signerConfig, signerConfigToMerge);
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

    function getHeader(headers, headerName) {
        for (var i = 0, j = headers.length; i < j; i++) {
            if (headers[i][0].toLowerCase() === headerName.toLowerCase()) {
                return headers[i][1];
            }
        }
        throw new Error('The ' + headerName.toLowerCase() + ' header is missing!');
    }

    function filterAndSortHeaders(requestOptions, signedHeaders) {
        var onlyTheSignedHeaders = function (header) {
            return signedHeaders.indexOf(header[0].toLowerCase()) !== -1;
        };
        requestOptions.headers = requestOptions.headers.filter(onlyTheSignedHeaders).sort(escherUtil.byLowerCaseHeaderKeys);
    }

// TODO: Date object in input
    function signRequest(requestOptions, body) {
        var formattedDate = (signerConfig.dateHeaderName.toLowerCase() === 'date' ? signerConfig.date : escherUtil.toLongDate(signerConfig.date));
        var defaultHeaders = escherUtil.normalizeHeaders([
            ['Host', requestOptions.host],
            [signerConfig.dateHeaderName, formattedDate]
        ]);
        addDefaultHeaders(defaultHeaders, requestOptions);
        requestOptions.headers.sort(escherUtil.byLowerCaseHeaderKeys);
        requestOptions.headers.push([signerConfig.authHeaderName.toLowerCase(), new AuthHeaderBuilder(signerConfig).generateHeader(requestOptions, body)]);
        return requestOptions;
    }

    function preSignUrl(url, expires) {
        return new AuthHeaderBuilder(signerConfig).generatePreSignedUrl(url, expires);
    }

    function validateRequest(requestOptions, requestBody, keyDB, currentDate) {
        var currentTime = (currentDate || new Date()).getTime();

        var headers = requestOptions.headers;
        var requestDate = getHeader(headers, signerConfig.dateHeaderName);
        var authHeader = getHeader(headers, signerConfig.authHeaderName);
        requestOptions.host = getHeader(headers, 'host');

        var parsedAuthParts = new AuthHeaderBuilder(signerConfig).parseAuthHeader(authHeader, requestDate, keyDB);

        filterAndSortHeaders(requestOptions, parsedAuthParts.signedHeaders);

        ['host', signerConfig.dateHeaderName].forEach(function (mandatoryHeader) {
            if (parsedAuthParts.signedHeaders.indexOf(mandatoryHeader.toLowerCase()) === -1) {
                throw new Error('The ' + mandatoryHeader.toLowerCase() + ' header is not signed!');
            }
        });

        if (parsedAuthParts.signerConfig.credentialScope !== signerConfig.credentialScope) {
            throw new Error('The credential scope is invalid!');
        }

        if (['sha256', 'sha512'].indexOf(parsedAuthParts.signerConfig.hashAlgo.toLowerCase()) === -1) {
            throw new Error('Only SHA256 and SHA512 hash algorithms are allowed!');
        }

        if (parsedAuthParts.shortDate !== escherUtil.toShortDate(requestDate)) {
            throw new Error('The credential date does not match with the request date!');
        }

        var requestTime = new Date(requestDate).getTime();
        if (requestTime < currentTime - FIFTEEN_MINUTES_IN_MILLISEC || currentTime + FIFTEEN_MINUTES_IN_MILLISEC < requestTime) {
            throw new Error('The request date is not within the accepted time range!');
        }

        var generatedAuthParts = new AuthHeaderBuilder(parsedAuthParts.signerConfig).buildAuthParts(requestOptions, requestBody);
        if (parsedAuthParts.signature !== generatedAuthParts.signature) {
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
