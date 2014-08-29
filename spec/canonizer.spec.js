'use strict';

var Canonicalizer = require('../lib/canonicalizer');
var fs = require('fs');
var _ = require('underscore')._;

function readTestFile(testCase, extension) {
    return fs.readFileSync('spec/aws4_testsuite/' + testCase + '.' + extension, {encoding: 'utf-8'});
}
function getMethod(requestLines) {
    return requestLines[0].split(' ')[0];
}
function getUri(requestLines) {
    return requestLines[0].split(' ')[1];
}
function getHeaders(requestLines) {
    return requestLines.slice(1, -2).reduce(function (acc, headerLine) {
        var header = headerLine.match(/([^:]*):(.*)/);
        acc[header[1]] = header[2];
        return acc;
    }, {});
}
function getBody(requestLines) {
    return requestLines[requestLines.length - 1];
}
function getHost(headers) {
    return headers[_.keys(headers).filter(function (key) {
        return key.toLowerCase() == 'host';
    })[0]];
}

describe('Canonizer', function () {
    describe('canonicalizeRequest', function () {
        it('should canonicalize the requests', function () {

            var requestLines = readTestFile('get-vanilla', 'req').split(/\r\n|\n|\r/);
            var body = getBody(requestLines);

            var options = {
                method: getMethod(requestLines),
                host: getHost(getHeaders(requestLines)),
                uri: getUri(requestLines),
                headers: getHeaders(requestLines)
            };

            var canonicalizedRequest = new Canonicalizer().canonicalizeRequest(options, body);

            expect(canonicalizedRequest).toBe(readTestFile('get-vanilla', 'creq'));
        });
    });
});
