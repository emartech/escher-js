"use strict";

var AuthHeaderBuilder = require('./authheaderbuilder'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var Escher = function (configToMerge) {
    var FIFTEEN_MINUTES_IN_MILLISEC = 900000; // TODO: should be configurable
    var config = escherUtil.mergeOptions({
        vendorPrefix:    'Escher',
        hashAlgo:        'SHA256', // TODO: is it lowercase or uppercase?
        date:            escherUtil.toLongDate(new Date()), // TODO: I would use a Date object, not a string internally
        credentialScope: 'escher_request',
        authHeaderName:  'Authorization', // TODO: should be X-Escher-Auth, but tests failing if I change it
        dateHeaderName:  'Date' // TODO: should be X-Escher-Date, but tests failing if I change it
    }, configToMerge);

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
        throw new Error('The ' + headerName.toLowerCase() + ' header is missing');
    }

    function filterAndSortHeaders(requestOptions, signedHeaders) {
        requestOptions.headers = requestOptions.headers.filter(function (header) {
            return signedHeaders.indexOf(header[0].toLowerCase()) !== -1;
        }).sort(escherUtil.byLowerCaseHeaderKeys);
    }

    // TODO: Date object in input
    function signRequest(requestOptions, body, headersToSign) {
        headersToSign = ['host', config.dateHeaderName.toLowerCase()].concat(headersToSign || []);
        var formattedDate = (config.dateHeaderName.toLowerCase() === 'date' ? config.date : escherUtil.toLongDate(config.date));
        var defaultHeaders = escherUtil.normalizeHeaders([
            ['Host', requestOptions.host],
            [config.dateHeaderName, formattedDate]
        ]);
        addDefaultHeaders(defaultHeaders, requestOptions);
        requestOptions.headers.sort(escherUtil.byLowerCaseHeaderKeys);
        requestOptions.headers.push([config.authHeaderName.toLowerCase(), new AuthHeaderBuilder(config).generateHeader(requestOptions, body, headersToSign)]);
        return requestOptions;
    }

    function preSignUrl(url, expires) {
        return new AuthHeaderBuilder(config).generatePreSignedUrl(url, expires);
    }

    function validateRequest(requestOptions, requestBody, keyDB, currentDate) {
        var currentTime = (currentDate || new Date()).getTime();

        var uri = escherUtil.parseUrl(requestOptions.uri, true);

        var signatureQueryKey = ('X-' + config.vendorKey + '-' + 'Signature');
        // TODO: I think we should check here if the HTTP method is GET, but
        // it seems it is just easier to create a separate method for checking
        // presigned URLs, as all you need to pass is an URL
        var isPresignedUrl = uri.query.hasOwnProperty(signatureQueryKey);
        var headers = requestOptions.headers;

        var requestDate;
        var parsedAuthParts;
        if (isPresignedUrl) {
            requestDate = uri.query['X-' + config.vendorKey + '-' + 'Date'];
            parsedAuthParts = new AuthHeaderBuilder(config).parseFromQuery(uri.query, requestDate, keyDB);
            requestBody = 'UNSIGNED-PAYLOAD';

            var canonicalizedQueryString = new Canonicalizer().canonicalizeQuery(escherUtil.filterKeysFrom(uri.query, [signatureQueryKey]));
            requestOptions.uri = uri.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');
        } else {
            requestDate = getHeader(headers, config.dateHeaderName);
            parsedAuthParts = new AuthHeaderBuilder(config).parseAuthHeader(getHeader(headers, config.authHeaderName), requestDate, keyDB);
        }

        requestOptions.host = getHeader(headers, 'host');
        filterAndSortHeaders(requestOptions, parsedAuthParts.signedHeaders);

        var mandatoryHeaders = ['host'].concat(isPresignedUrl ? [] : [config.dateHeaderName]);
        mandatoryHeaders.forEach(function (mandatoryHeader) {
            if (parsedAuthParts.signedHeaders.indexOf(mandatoryHeader.toLowerCase()) === -1) {
                throw new Error('The ' + mandatoryHeader.toLowerCase() + ' header is not signed');
            }
        });

        if (parsedAuthParts.config.credentialScope !== config.credentialScope) {
            throw new Error('The credential scope is invalid');
        }

        if (['sha256', 'sha512'].indexOf(parsedAuthParts.config.hashAlgo.toLowerCase()) === -1) {
            throw new Error('Only SHA256 and SHA512 hash algorithms are allowed');
        }

        if (parsedAuthParts.shortDate !== escherUtil.toShortDate(requestDate)) {
            throw new Error('The credential date does not match with the request date');
        }

        var requestTime = new Date(requestDate).getTime();
        if (requestTime < currentTime - FIFTEEN_MINUTES_IN_MILLISEC || currentTime + FIFTEEN_MINUTES_IN_MILLISEC < requestTime) {
            throw new Error('The request date is not within the accepted time range');
        }

        var generatedAuthParts = new AuthHeaderBuilder(parsedAuthParts.config).buildAuthParts(requestOptions, requestBody, parsedAuthParts.signedHeaders);
        if (parsedAuthParts.signature !== generatedAuthParts.signature) {
            throw new Error('The signatures do not match');
        }
    }

    return {
        validateRequest: validateRequest,
        preSignUrl: preSignUrl,
        signRequest: signRequest
    };
};

module.exports = Escher;
