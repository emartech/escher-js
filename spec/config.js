var config = {
  aws4: {
    signRequest: [
      'get-vanilla',
      'post-vanilla',
      'get-vanilla-query',
      'post-vanilla-query',
      'get-vanilla-empty-query-key',
      'post-vanilla-empty-query-value',
      'get-vanilla-query-order-key',
      'post-x-www-form-urlencoded',
      'post-x-www-form-urlencoded-parameters',
      'get-header-value-trim',
      'post-header-key-case',
      'post-header-key-sort',
      'post-header-value-case',
      'get-vanilla-query-order-value',
      'get-vanilla-query-order-key-case',
      'get-unreserved',
      'get-vanilla-query-unreserved',
      'get-vanilla-ut8-query',
      'get-utf8',
      'get-space',
      'post-vanilla-query-space',
      'post-vanilla-query-nonunreserved',
      'get-slash',
      'get-slashes',
      'get-slash-dot-slash',
      'get-slash-pointless-dot',
      'get-relative',
      'get-relative-relative'
    ],
    presignUrl: [],
    authenticate: []
  },
  emarsys: {
    signRequest: [
      'signrequest-get-header-key-duplicate',
      'signrequest-get-header-value-order',
      'signrequest-post-header-key-order',
      'signrequest-post-header-value-spaces',
      'signrequest-post-header-value-spaces-within-quotes',
      'signrequest-post-payload-utf8',
      'signrequest-date-header-should-be-signed-headers',
      'signrequest-support-custom-config',
      'signrequest-only-sign-specified-headers'
    ],
    presignUrl: [
      'presignurl-valid-with-path-query'
    ],
    authenticate: [
      'authenticate-valid-authentication-datein-expiretime',
      'authenticate-valid-get-vanilla-empty-query',
      'authenticate-valid-get-vanilla-empty-query-with-custom-headernames',
      'authenticate-valid-presigned-url-with-query',
      'authenticate-error-host-header-not-signed',
      'authenticate-error-date-header-not-signed',
      'authenticate-error-invalid-auth-header',
      'authenticate-error-invalid-escher-key',
      'authenticate-error-invalid-credential-scope',
      'authenticate-error-invalid-hash-algorithm',
      'authenticate-error-missing-auth-header',
      'authenticate-error-missing-host-header',
      'authenticate-error-missing-date-header',
      'authenticate-error-date-header-auth-header-date-not-equal',
      'authenticate-error-request-date-invalid',
      'authenticate-error-wrong-signature'
    ]
  }
};

function getTestSuites() {
  return Object.keys(config);
}

function getTestFilesForSuite(testSuite, topic) {
  return config[testSuite][topic];
}

module.exports = {
  getTestSuites: getTestSuites,
  getTestFilesForSuite: getTestFilesForSuite
};
