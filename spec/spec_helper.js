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
    var fileName = 'spec/' + testSuite + '_testsuite/' + testFile + '.json';
    var test = JSON.parse(fs.readFileSync(fileName, {encoding: 'utf-8'}));
    if (test.config.date) {
        test.config.date = new Date(test.config.date);
    }
    return test;
}

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
