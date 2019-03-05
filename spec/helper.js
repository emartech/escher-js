'use strict';

const fs = require('fs');
const testConfig = require('./config');

class Helper {
  static runTestFiles(topic, func) {
    testConfig.getTestSuites().forEach(function(testSuite) {
      Helper._using(testSuite, topic, func);
    });
  }

  static _using(testSuite, topic, func) {
    /* jshint -W040 */
    const testFiles = testConfig.getTestFilesForSuite(testSuite, topic);
    testFiles.forEach(testFile => func.call(this, Helper._getTest(testSuite, testFile)));
  }

  static _getTest(testSuite, testFile) {
    const fileName = 'spec/' + testSuite + '_testsuite/' + testFile + '.json';
    return JSON.parse(fs.readFileSync(fileName, { encoding: 'utf-8' }));
  }

  static createKeyDb(keyDb) {
    return key => {
      for (let i = 0; i < keyDb.length; i++) {
        if (keyDb[i][0] === key) {
          return keyDb[i][1];
        }
      }
    };
  }
}

module.exports = Helper;
