"use strict";

var _ = require('underscore')._,
    crypto = require('crypto'),
    path = require('path'),
    url = require('url');

var Canonicalizer = function () {
    // node 0.11 urlencodes caret as %5E
    var haveToFixCaretAtUrlParser = url.parse("^").href!=='^';

    function prepareHeaders(headers) {
        var results = {};
        function addKeyToResult(header) {
            var key = header[0].toLowerCase().trim(),
                value = header[1].trim(); // TODO: we should handle qoutes and spaces inside string
            if (results[key]) {
                results[key] += ',' + value;
            } else {
                results[key] = value;
            }
        }
        if (headers instanceof Array) {
            headers.forEach(addKeyToResult);
        } else {
            _.pairs(headers).map(addKeyToResult);
        }
        return results;
    }

    function canonicalizeHeaders(headers) {
        return _.pairs(headers).map(function (header) {
          return header[0] + ':' + header[1];
        });
    }

    function canonicalizeSignedHeaders(headers) {
        return _.keys(headers).map(function (headerName) {
            return headerName;
        }).join(';');
    }

    function canonicalizeQuery(parsedUrl) {
        var pieces = [];
        _.pairs(parsedUrl.query).forEach(function (queryParam) {
            if (typeof queryParam[1] === 'string') {
                pieces.push(joinQueryKeyValue(queryParam[0], queryParam[1]));
            } else {
                queryParam[1].forEach(function(value){
                    pieces.push(joinQueryKeyValue(queryParam[0], value));
                });
            }
        });
        pieces.sort();
        return pieces.join('&');
    }

    function joinQueryKeyValue(key, value) {
        if (haveToFixCaretAtUrlParser) {
            key = key.replace('%5E', '^');
            value = value.replace('%5E', '^');
        }
        return encodeURIComponent(key) + '=' + encodeURIComponent(value);
    }

    function prepareUri(requestOptions) {
        // https://github.com/joyent/node/blob/4b59db008cec1bfcca2783f4b27c630c9c3fdd73/lib/url.js#L113-L117
        return requestOptions.uri.replace('#', '%23').replace('\\', '%5C');
    }

    function canonicalizePath(parsedUrl) {
        return path.normalize(parsedUrl.pathname);
    }

    function canonicalizeRequest(requestOptions, body) {
        var parsedUrl = url.parse(prepareUri(requestOptions), true);
        var headers = prepareHeaders(requestOptions.headers);
        return [].concat([
            requestOptions.method.toUpperCase(),
            canonicalizePath(parsedUrl),
            canonicalizeQuery(parsedUrl)
        ], canonicalizeHeaders(headers), [
            '',
            canonicalizeSignedHeaders(headers),
            crypto.createHash('sha256').update(body).digest('hex')
        ]).join('\n');
    }

    return {
        canonicalizeRequest: canonicalizeRequest
    };

};

module.exports = Canonicalizer;
