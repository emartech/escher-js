"use strict";

var AuthHelper = require('./authhelper'),
    Canonicalizer = require('./canonicalizer'),
    escherUtil = require('./escherutil');

function getHeader(headers, headerName) {
    // TODO: Where we have to support this array/object polimorphism?
    headerName = headerName.toLowerCase();
    if (headers instanceof Array) {
        for (var i = 0, j = headers.length; i < j; i++) {
            if (headers[i][0].toLowerCase() === headerName) {
                return headers[i][1];
            }
        }
    } else {
        if (headers.hasOwnProperty(headerName)) {
            return headers[headerName];
        }
    }
    throw new Error('The ' + headerName + ' header is missing');
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

var Escher = function (configToMerge) {

    var config = escherUtil.mergeOptions({
        algoPrefix:      'ESR',
        vendorKey:       'Escher',
        hashAlgo:        'SHA256',
        date:            new Date(),
        credentialScope: 'escher_request',
        authHeaderName:  'X-Escher-Auth',
        dateHeaderName:  'X-Escher-Date',
        clockSkew:       900
    }, configToMerge);

    // validate the configuration
    if (typeof config.vendorKey !== 'string' || config.vendorKey !== config.vendorKey.toUpperCase()) {
        throw new Error('Vendor key should be uppercase string');
    }
    if (typeof config.algoPrefix !== 'string') {
        throw new Error('Algorithm prefix should be a string');
    }
    if (typeof config.hashAlgo !== 'string' || ['SHA256', 'SHA512'].indexOf(config.hashAlgo) === -1) {
        throw new Error('Only SHA256 and SHA512 hash algorithms are allowed');
    }
    if (!(config.date instanceof Date)) {
        throw new Error('Date should be a JavaScript Date object');
    }

    this._config = config;
};

Escher.prototype = {
    preSignUrl: function (url, expires) {
        return new AuthHelper(this._config).generatePreSignedUrl(url, expires);
    },

    signRequest: function (requestOptions, body, headersToSign) {
        headersToSign = ['host', this._config.dateHeaderName.toLowerCase()].concat(headersToSign || []);
        var formattedDate = (this._config.dateHeaderName.toLowerCase() === 'date' ? escherUtil.toHeaderDateFormat(this._config.date) : escherUtil.toLongDate(this._config.date));
        var defaultHeaders = escherUtil.normalizeHeaders([
            [this._config.dateHeaderName, formattedDate]
        ]);
        addDefaultHeaders(defaultHeaders, requestOptions);
        requestOptions.headers.sort(escherUtil.byLowerCaseHeaderKeys);
        requestOptions.headers.push([this._config.authHeaderName.toLowerCase(), new AuthHelper(this._config).generateHeader(requestOptions, body, headersToSign)]);
        return requestOptions;
    },

    authenticate: function (request, keyDB) {
        var uri = escherUtil.parseUrl(request.url, true);
        var isPresignedUrl = uri.query.hasOwnProperty(this._queryParamKey('Signature')) && request.method === 'GET';
        var headers = request.headers;

        var requestBody, requestDate, parsedAuthParts, expires;
        if (isPresignedUrl) {
            requestDate = escherUtil.parseLongDate(uri.query[this._queryParamKey('Date')]);
            parsedAuthParts = new AuthHelper(this._config).parseFromQuery(uri.query, requestDate, keyDB);
            requestBody = 'UNSIGNED-PAYLOAD';
            expires = parseInt(uri.query[this._queryParamKey('Expires')]);

            var canonicalizedQueryString = new Canonicalizer().canonicalizeQuery(escherUtil.filterKeysFrom(uri.query, [this._queryParamKey('Signature')]));
            request.url = uri.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');
        } else {
            requestDate = this._config.dateHeaderName.toLowerCase() === 'date' ? new Date(getHeader(headers, this._config.dateHeaderName)) : escherUtil.parseLongDate(getHeader(headers, this._config.dateHeaderName));
            parsedAuthParts = new AuthHelper(this._config).parseAuthHeader(getHeader(headers, this._config.authHeaderName), requestDate, keyDB);
            requestBody = request.body || '';
            expires = 0;
        }

        if (!request.host) {
            request.host = getHeader(headers, 'host');
        }

        var mandatoryHeaders = ['host'].concat(isPresignedUrl ? [] : [this._config.dateHeaderName]);
        mandatoryHeaders.forEach(function (mandatoryHeader) {
            if (parsedAuthParts.signedHeaders.indexOf(mandatoryHeader.toLowerCase()) === -1) {
                throw new Error('The ' + mandatoryHeader.toLowerCase() + ' header is not signed');
            }
        });

        if (parsedAuthParts.config.credentialScope !== this._config.credentialScope) {
            throw new Error('The credential scope is invalid');
        }

        if (['SHA256', 'SHA512'].indexOf(parsedAuthParts.config.hashAlgo) === -1) {
            throw new Error('Only SHA256 and SHA512 hash algorithms are allowed');
        }

        if (parsedAuthParts.shortDate !== escherUtil.toShortDate(requestDate)) {
            throw new Error('The credential date does not match with the request date');
        }

        var requestTime = requestDate.getTime();
        var currentTime = this._config.date.getTime();
        if (!this._isDateWithinRange(requestTime, currentTime, expires)) {
            throw new Error('The request date is not within the accepted time range');
        }

        var generatedAuthParts = new AuthHelper(parsedAuthParts.config).buildAuthParts(request, requestBody, parsedAuthParts.signedHeaders);
        if (parsedAuthParts.signature !== generatedAuthParts.signature) {
            throw new Error('The signatures do not match');
        }
        return parsedAuthParts.config.accessKeyId;
    },

    _isDateWithinRange: function (requestTime, currentTime, expires) {
        return (requestTime - this._config.clockSkew * 1000 <= currentTime) &&
            (currentTime < requestTime + expires * 1000 + this._config.clockSkew * 1000);
    },

    _queryParamKey: function (param) {
        return 'X-' + this._config.vendorKey + '-' + param;
    }
};


Escher.create = function(configToMerge) {
  return new Escher(configToMerge);
};

module.exports = Escher;
