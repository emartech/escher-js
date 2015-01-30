'use strict';

var Canonicalizer = require('../lib/canonicalizer');

describe('Canonicalizer', function () {
    describe('canonicalizeRequest', function () {

        runTestFiles(function(test){
            it('should canonicalize the requests', function () {
                var canonicalizedRequest = new Canonicalizer('SHA256').canonicalizeRequest(test.request, test.request.body, test.headersToSign);
                expect(canonicalizedRequest).toBe(test.expected.canonicalizedRequest);
            });
        });

    });
});
