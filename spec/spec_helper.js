"use strict";

var fs = require('fs');

function using(name, values, func){
    /* jshint -W040 */
    for (var i = 0, count = values.length; i < count; i++) {
        if (Object.prototype.toString.call(values[i]) !== '[object Array]') {
            values[i] = [values[i]];
        }
        func.apply(this, values[i]);
        jasmine.currentEnv_.currentSpec.description += ' (with "' + name + '" using ' + values[i].join(', ') + ')';
    }
}

function bin2hex(s) {
    var i, l, o = '', n;
    s += '';
    for (i = 0, l = s.length; i < l; i++) {
        n = s.charCodeAt(i).toString(16);
        o += n.length < 2 ? '0' + n : n;
    }
    return o;
}

function readTestFile(testSuite, testCase, extension) {
    var fileName = 'spec/' + testSuite + '_testsuite/' + testCase + '.' + extension;
    return fs.readFileSync(fileName, {encoding: 'utf-8'});
}

var TestFileParser = function(testFileContent) {

    var requestLines = testFileContent.split(/\r\n|\n|\r/);

    function getMethod() {
        return requestLines[0].split(' ')[0];
    }

    function getUri() {
        return requestLines[0].split(' ')[1];
    }

    function getHeaders() {
        return requestLines.slice(1, -2).reduce(function (acc, headerLine) {
            var header = headerLine.match(/([^:]*):(.*)/);
            acc.push([header[1], header[2]]);
            return acc;
        }, []);
    }

    function getHeadersToSign() {
        return getHeaders().map(function (header) {
            return header[0];
        });
    }

    function getBody() {
        return requestLines[requestLines.length - 1];
    }

    function getHost(headers) {
        return lookupHeader(headers, 'host');
    }

    function getDate(headers) {
        return lookupHeader(headers, 'date');
    }

    function lookupHeader(headers, headerKey) {
        for(var i=0; i<headers.length; i++) {
            if (headers[i][0].toLowerCase() === headerKey) {
                return headers[i][1];
            }
        }
    }

    return {
        getMethod: getMethod,
        getUri: getUri,
        getHeaders: getHeaders,
        getHeadersToSign: getHeadersToSign,
        getBody: getBody,
        getHost: getHost,
        getDate: getDate
    };
};

function createKeyDb(keyDBHash) {
    return function (accessKeyId) {
        return keyDBHash[accessKeyId];
    };
}

module.exports = {
    using: using,
    readTestFile: readTestFile,
    TestFileParser: TestFileParser,
    bin2hex: bin2hex,
    createKeyDb: createKeyDb
};
