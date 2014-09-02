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

    function signRequest(requestOptions, body) {
        var defaultHeaders = escherUtil.normalizeHeaders([
            ['Host', requestOptions.host],
            [signerConfig.dateHeaderName, signerConfig.date]
        ]);
        addDefaultHeaders(defaultHeaders, requestOptions);
        requestOptions.headers.sort(escherUtil.byLowerCaseHeaderKeys);
        requestOptions.headers.push(['Authorization', new AuthHeaderBuilder(signerConfig).generateHeader(requestOptions, body)]);
        return requestOptions;
    }

    function preSignUrl() {
        // TODO: implement
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

    function validateRequest(requestOptions, requestBody, keyDB, currentDate) {
        currentDate = currentDate || new Date();

        var headers = requestOptions.headers;
        var requestDate = getHeader(headers, signerConfig.dateHeaderName);
        var authHeader = getHeader(headers, signerConfig.authHeaderName);
        requestOptions.host = getHeader(headers, 'host');

        var parsedAuthParts = new AuthHeaderBuilder(signerConfig).parseAuthHeader(authHeader, requestDate, keyDB);

        filterAndSortHeaders(requestOptions, parsedAuthParts.signedHeaders);

        var generatedAuthParts = new AuthHeaderBuilder(parsedAuthParts.signerConfig).buildAuthParts(requestOptions, requestBody);

        if (parsedAuthParts.signedHeaders.indexOf(signerConfig.dateHeaderName.toLowerCase()) === -1) {
            throw new Error('The date header is not signed!');
        }

        if (parsedAuthParts.shortDate !== escherUtil.toShortDate(requestDate)) {
            throw new Error('The credential date does not match with the request date!');
        }
        var requestTime = new Date(requestDate).getTime();
        if (requestTime < currentDate.getTime() - FIFTEEN_MINUTES_IN_MILLISEC || currentDate.getTime() + FIFTEEN_MINUTES_IN_MILLISEC < requestTime) {
            throw new Error('The request date is not within the accepted time range!');
        }
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
