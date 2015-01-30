"use strict";

var fs = require('fs'),
    testConfig = require('./test_config');

function runTestFiles(func) {
    testConfig.getTestSuites().forEach(function (testSuite) {
        using(testSuite, func);
    });
}

function using(testSuite, func){
    /* jshint -W040 */
    var testFiles = testConfig.getTestFilesForSuite(testSuite);
    for (var i = 0, count = testFiles.length; i < count; i++) {
        func.call(this, getTest(testSuite, testFiles[i]));
        jasmine.currentEnv_.currentSpec.description += ' (with "' + testSuite + '" using ' + testFiles[i] + ')';
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

function getTest(testSuite, testFile) {
    var test = new TestFileParser(readTestFile(testSuite, testFile, 'req'));
    test.config = testConfig.getConfigForSuite(testSuite);
    test.config.date = test.date;
    test.expected = {
        "request": new TestFileParser(readTestFile(testSuite, testFile, 'sreq')).request,
        "canonicalizedRequest": readTestFile(testSuite, testFile, 'creq'),
        "stringToSign": readTestFile(testSuite, testFile, 'sts'),
        "authHeader": readTestFile(testSuite, testFile, 'authz')
    };
    return test;
}

function readTestFile(testSuite, testCase, extension) {
    var fileName = 'spec/' + testSuite + '_testsuite/' + testCase + '.' + extension;
    return fs.readFileSync(fileName, {encoding: 'utf-8'});
}

var TestFileParser = function(testFileContent) {
    var requestLines = testFileContent.split(/\r\n|\r|\n/);

    var headersArray = [],
        headersMap = {},
        headersToSign = [];

    requestLines.slice(2, -2).forEach(function (headerLine) {
        var header = headerLine.match(/([^:]*):(.*)/);
        headersArray.push([header[1], header[2]]);
        headersMap[header[1].toLowerCase()] = header[2];
        headersToSign.push(header[1]);
    });

    this.date = new Date(headersMap['date']);
    this.headersToSign = headersToSign;
    this.request = {
        "host": headersMap['host'],  // TODO: Do we really need it? It's available in headers
        "method": requestLines[0],
        "url": requestLines[1],
        "headers": headersArray,
        "body": requestLines[requestLines.length - 1]
    };
};

function createKeyDb(keyDBHash) {
    return function (accessKeyId) {
        return keyDBHash[accessKeyId];
    };
}

module.exports = {
    runTestFiles: runTestFiles,
    bin2hex: bin2hex,
    createKeyDb: createKeyDb
};
