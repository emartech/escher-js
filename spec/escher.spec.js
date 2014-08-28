'use strict';

var Escher = require('../lib/escher');

describe('Escher', function () {
    describe('signRequest', function () {
        it('should be an existing method', function () {

            expect(new Escher().signRequest).toBeTruthy();

        });
    });
});
