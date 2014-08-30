var _ = require('underscore')._,
    fs = require('fs');

function using(name, values, func){
    for (var i = 0, count = values.length; i < count; i++) {
        if (Object.prototype.toString.call(values[i]) !== '[object Array]') {
            values[i] = [values[i]];
        }
        func.apply(this, values[i]);
        jasmine.currentEnv_.currentSpec.description += ' (with "' + name + '" using ' + values[i].join(', ') + ')';
    }
}
function readTestFile(testCase, extension) {
    return fs.readFileSync('spec/aws4_testsuite/' + testCase + '.' + extension, {encoding: 'utf-8'});
}

var AWSTestFileParser = function(testFileContent) {

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
            acc[header[1]] = header[2];
            return acc;
        }, {});
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
            if (headers[i][0].toLowerCase() == headerKey) {
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
    AWSTestFileParser: AWSTestFileParser
};
