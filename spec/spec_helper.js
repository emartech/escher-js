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

function readTestFile(testCase, extension) {
    var tc = testCase.split(':');
    return fs.readFileSync('spec/' + tc[0] + '_testsuite/' + tc[1] + '.' + extension, {encoding: 'utf-8'});
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

    function getBody() {
        return requestLines[requestLines.length - 1];
    }

    function getHost(headers) {
        return lookupHeader(headers, 'host');
    }

    function getDate(headers) {
        return new Date(lookupHeader(headers, 'date'));
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
        getBody: getBody,
        getHost: getHost,
        getDate: getDate
    };
};

module.exports = {
    using: using,
    readTestFile: readTestFile,
    TestFileParser: TestFileParser,
    bin2hex: bin2hex
};
