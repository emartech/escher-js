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

    function getKeyParts(signerOptions) {
        return [escherUtil.toShortDate(signerOptions.date)].concat(signerOptions.credentialScope.split(/\//g));
    }

    function calculateSigningKey(signerOptions) {

        signerOptions = addDefaultSignerOptions(signerOptions);

        var signingKey = signerOptions.algoPrefix + signerOptions.apiSecret;

        getKeyParts(signerOptions).forEach(function(data) {
            signingKey = crypto.createHmac(signerOptions.hashAlgo, signingKey).update(data).digest('binary');
        });

        return signingKey;
    }

    function addDefaultSignerOptions(signerOptions) {
        return _.defaults(signerOptions || {}, {
            hashAlgo: "sha256",
            date: new Date(),
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request'
        });
    }

    function getStringToSign(requestOptions, body, signerOptions) {

        signerOptions = addDefaultSignerOptions(signerOptions);

        var hash = createHashFunction(signerOptions.hashAlgo);

        return [
            signerOptions.algoPrefix.toUpperCase() + '-HMAC-' + signerOptions.hashAlgo.toUpperCase(),
            toLongDate(signerOptions.date),
            toShortDate(signerOptions.date) + '/' + signerOptions.credentialScope,
            hash(new Canonicalizer().canonicalizeRequest(requestOptions, body))
        ].join("\n");
    }

    return {
        getStringToSign: getStringToSign,
        calculateSigningKey: calculateSigningKey
    }

};

module.exports = Signer;
