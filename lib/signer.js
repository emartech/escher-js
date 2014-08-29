var Canonicalizer = require('../lib/canonicalizer'),
    _ = require('underscore')._,
    crypto = require('crypto');

var Signer = function () {

    function toLongDate(date) {
        return date.toISOString().replace(/-/g, '').replace(/:/g, '').replace(/\..*Z/, 'Z');
    }

    function toShortDate(date) {
        return toLongDate(date).substring(0, 8);
    }

    function createHashFunction(hashAlgo) {
        return function (string) {
            return crypto.createHash(hashAlgo).update(string).digest('hex');
        };
    }

    function getStringToSign(requestOptions, body, signerOptions) {

        signerOptions = _.defaults(signerOptions || {}, {
            hashAlgo: "sha256",
            date: new Date(),
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request'
        });

        var hash = createHashFunction(signerOptions.hashAlgo);

        return [
            signerOptions.algoPrefix.toUpperCase() + '-HMAC-' + signerOptions.hashAlgo.toUpperCase(),
            toLongDate(signerOptions.date),
            toShortDate(signerOptions.date) + '/' + signerOptions.credentialScope,
            hash(new Canonicalizer().canonicalizeRequest(requestOptions, body))
        ].join("\n");
    }

    return {
        getStringToSign: getStringToSign
    }

};

module.exports = Signer;
