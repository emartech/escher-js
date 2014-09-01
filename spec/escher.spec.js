"use strict";

var Escher = require('../lib/escher');

describe('Escher', function () {
    describe('signRequest', function () {
        it('should be an existing method', function () {

            expect(new Escher().signRequest).toBeTruthy();

        });
    });

    describe('validateRequest', function () {
        it('should validate request using auth header', function () {
            var goodAuthHeader =
                    'AWS4-HMAC-SHA256 ' +
                    'Credential=AKIDEXAMPLE/20110909/us-east-1/host/aws4_request, ' +
                    'SignedHeaders=date;host, ' +
                    'Signature=b27ccfbfa7df52a200ff74193ca6e32d4b48b8856fab7ebf1c595d0670a7e470';
            var headers = [
                ['Date', 'Mon, 09 Sep 2011 23:36:00 GMT'],
                ['Host', 'host.foo.com'],
                ['Authorization', goodAuthHeader]
            ];
            var keyDB = function (accessKey) {
                var keys = {'AKIDEXAMPLE': 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY'};
                return keys[accessKey];
            };
            var escherConfig =   {
                authHeaderName:  'Authorization',
                dateHeaderName:  'Date',
                algoPrefix:      'AWS4',
                credentialScope: 'us-east-1/host/aws4_request',
                date:            new Date('Mon, 09 Sep 2011 23:40:00 GMT')
            };
            var requestOptions = {
                method: 'GET',
                host: 'host.foo.com',
                uri: '/',
                headers: headers
            };

            expect(new Escher(escherConfig).validateRequest(requestOptions, '', keyDB)).toBeTruthy();
        });
    });
});
