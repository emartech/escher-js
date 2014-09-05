"use strict";

var AuthHelper = require('./authhelper'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

var Escher = function (configToMerge) {

    var config = escherUtil.mergeOptions({
        vendorPrefix:    'Escher',
        hashAlgo:        'SHA256', // TODO: is it lowercase or uppercase?
        date:            escherUtil.toLongDate(new Date()), // TODO: I would use a Date object, not a string internally
        credentialScope: 'escher_request',
        authHeaderName:  'Authorization', // TODO: should be X-Escher-Auth, but tests failing if I change it
        dateHeaderName:  'Date', // TODO: should be X-Escher-Date, but tests failing if I change it
        clockSkew: 900000 // TODO: should be configurable
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

    function signRequest(requestOptions, body, headersToSign) {
        headersToSign = ['host', config.dateHeaderName.toLowerCase()].concat(headersToSign || []);
        var formattedDate = (config.dateHeaderName.toLowerCase() === 'date' ? escherUtil.toHeaderDateFormat(config.date) : escherUtil.toLongDate(config.date));
        var defaultHeaders = escherUtil.normalizeHeaders([
            ['Host', requestOptions.host],
            [config.dateHeaderName, formattedDate]
        ]);
        addDefaultHeaders(defaultHeaders, requestOptions);
        requestOptions.headers.sort(escherUtil.byLowerCaseHeaderKeys);
        requestOptions.headers.push([config.authHeaderName.toLowerCase(), new AuthHelper(config).generateHeader(requestOptions, body, headersToSign)]);
        return requestOptions;
    }

    function preSignUrl(url, expires) {
        return new AuthHelper(config).generatePreSignedUrl(url, expires);
    }

    function validateRequest(requestOptions, requestBody, keyDB, currentDate) {
        var currentTime = (currentDate || new Date()).getTime();
        var uri = escherUtil.parseUrl(requestOptions.uri, true);
        // TODO: I think we should check here if the HTTP method is GET, but
        // it seems it is just easier to create a separate method for checking
        // presigned URLs, as all you need to pass is an URL
        var isPresignedUrl = uri.query.hasOwnProperty(queryParamKey('Signature'));
        var headers = requestOptions.headers;

        var requestDate, parsedAuthParts, timeWindow;
        if (isPresignedUrl) {
            requestDate = uri.query[queryParamKey('Date')];
            parsedAuthParts = new AuthHelper(config).parseFromQuery(uri.query, requestDate, keyDB);
            requestBody = 'UNSIGNED-PAYLOAD';
            timeWindow = uri.query[queryParamKey('Expires')];

            var canonicalizedQueryString = new Canonicalizer().canonicalizeQuery(escherUtil.filterKeysFrom(uri.query, [queryParamKey('Signature')]));
            requestOptions.uri = uri.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');
        } else {
            requestDate = getHeader(headers, config.dateHeaderName);
            parsedAuthParts = new AuthHelper(config).parseAuthHeader(getHeader(headers, config.authHeaderName), requestDate, keyDB);
            timeWindow = config.clockSkew;
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
        if (requestTime < currentTime - timeWindow || currentTime + timeWindow < requestTime) {
            throw new Error('The request date is not within the accepted time range');
        }

        var generatedAuthParts = new AuthHelper(parsedAuthParts.config).buildAuthParts(requestOptions, requestBody, parsedAuthParts.signedHeaders);
        if (parsedAuthParts.signature !== generatedAuthParts.signature) {
            throw new Error('The signatures do not match');
        }
    }

    function queryParamKey(param) {
        return 'X-' + config.vendorKey + '-' + param;
    }

    return {
        validateRequest: validateRequest,
        preSignUrl: preSignUrl,
        signRequest: signRequest
    };
};

module.exports = Escher;
