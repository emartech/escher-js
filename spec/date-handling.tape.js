const querystring = require('querystring');
const tape = require('tape');
const { Escher } = require('../src/escher');
const { Utils } = require('../src/utils');
const { timeDecorator } = require('./decorators');
const { clone } = require('ramda');

const configWithoutSpecifiedDate = {
  accessKeyId: 'AKIDEXAMPLE',
  apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
  clockSkew: 0
};
const urlToSign = 'https://example.com/something?foo=bar&baz=barbaz';
const requestToSign = {
  method: 'GET',
  url: '/',
  headers: [['Host', 'host.foo.com']]
};

module.exports = { runDateHandlingTests };

function runDateHandlingTests() {
  tape(
    'Escher #signRequest should use the current date if date is not specified',
    timeDecorator({ timestamp: createTimestamp() }, ({ args: [t] }) => {
      const escher = new Escher(configWithoutSpecifiedDate);

      const signedRequest = escher.signRequest(clone(requestToSign), '');
      const date = Utils.getHeader(signedRequest, 'x-escher-date');

      t.equal(date, '19780210T010203Z');
      t.end();
    })
  );

  tape(
    'Escher #signRequest should use the current date for each sign',
    timeDecorator({ timestamp: createTimestamp() }, ({ args: [t], clock }) => {
      const escher = new Escher(configWithoutSpecifiedDate);

      const firstSignedRequest = escher.signRequest(clone(requestToSign), '');
      const firstDate = Utils.getHeader(firstSignedRequest, 'x-escher-date');
      clock.tick(1000);
      const secondSignedRequest = escher.signRequest(clone(requestToSign), '');
      const secondDate = Utils.getHeader(secondSignedRequest, 'x-escher-date');

      t.equal(firstDate, '19780210T010203Z');
      t.equal(secondDate, '19780210T010204Z');

      t.end();
    })
  );

  tape(
    'Escher #presignUrl should use the current date if date is not specified',
    timeDecorator({ timestamp: createTimestamp() }, ({ args: [t] }) => {
      const escher = new Escher(configWithoutSpecifiedDate);

      const signedUrl = escher.preSignUrl(urlToSign, 60);
      const query = querystring.parse(Utils.parseUrl(signedUrl).query);
      const date = query['X-ESCHER-Date'];

      t.equal(date, '19780210T010203Z');
      t.end();
    })
  );

  tape(
    'Escher #presignUrl should use the current date for each sign',
    timeDecorator({ timestamp: createTimestamp() }, ({ args: [t], clock }) => {
      const escher = new Escher(configWithoutSpecifiedDate);

      const firstSignedUrl = escher.preSignUrl(urlToSign, 60);
      const firstQuery = querystring.parse(Utils.parseUrl(firstSignedUrl).query);
      const firstDate = firstQuery['X-ESCHER-Date'];
      clock.tick(1000);
      const secondSignedUrl = escher.preSignUrl(urlToSign, 60);
      const secondQuery = querystring.parse(Utils.parseUrl(secondSignedUrl).query);
      const secondDate = secondQuery['X-ESCHER-Date'];

      t.equal(firstDate, '19780210T010203Z');
      t.equal(secondDate, '19780210T010204Z');
      t.end();
    })
  );

  tape(
    'Escher #authenticate should use the current date when method called, not the date of instantiation',
    timeDecorator({ timestamp: createTimestamp() }, ({ args: [t], clock }) => {
      const escher = new Escher(configWithoutSpecifiedDate);
      clock.tick(15 * 60 * 1000);

      const signedUrl = escher.preSignUrl(urlToSign, 1);
      const parsedSignedUrl = Utils.parseUrl(signedUrl);

      t.doesNotThrow(() =>
        escher.authenticate(
          {
            method: 'GET',
            url: parsedSignedUrl.path,
            headers: [['Host', parsedSignedUrl.host]]
          },
          keyDb
        )
      );
      t.end();
    })
  );
}

function createTimestamp() {
  return new Date(Date.UTC(1978, 1, 10, 1, 2, 3)).getTime();
}

function keyDb(accessKeyId) {
  return accessKeyId === 'AKIDEXAMPLE' ? 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY' : null;
}
