var Canonicalizer = require('../lib/canonicalizer'),
    _ = require('underscore')._,
    crypto = require('crypto'),
    escherUtil = require('../lib/escherutil'),
    toLongDate = escherUtil.toLongDate,
    toShortDate = escherUtil.toShortDate;

var Signer = function () {

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
