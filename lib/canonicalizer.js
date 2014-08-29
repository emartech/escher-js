var _ = require('underscore')._;
var crypto = require('crypto');

var Canonicalizer = function () {

    function canonicalizeHeaders(headers) {
        return _.pairs(headers).map(function (header) {
            return header[0].toLowerCase() + ':' + header[1]
        });
    }

    function canonicalizeRequest(requestOptions, body) {
        return [].concat([
            requestOptions.method.toUpperCase(),
            requestOptions.uri,
            ''
        ], canonicalizeHeaders(requestOptions.headers), [
            '',
            _.keys(requestOptions.headers).map(function (headerName) {return headerName.toLowerCase();}).join(';'),
            crypto.createHash('sha256').update(body).digest('hex')
        ]).join('\n');
    }

    return {
        canonicalizeRequest: canonicalizeRequest
    }

};

module.exports = Canonicalizer;
