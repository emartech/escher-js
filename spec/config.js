var config = {
  aws4: {
    signRequest: [
      'signrequest-get-vanilla',
      'signrequest-post-vanilla',
      'signrequest-get-vanilla-query',
      'signrequest-post-vanilla-query',
      'signrequest-get-vanilla-empty-query-key',
      'signrequest-post-vanilla-empty-query-value',
      'signrequest-get-vanilla-query-order-key',
      'signrequest-post-x-www-form-urlencoded',
      'signrequest-post-x-www-form-urlencoded-parameters',
      'signrequest-get-header-value-trim',
      'signrequest-post-header-key-case',
      'signrequest-post-header-key-sort',
      'signrequest-post-header-value-case',
      'signrequest-get-vanilla-query-order-value',
      'signrequest-get-vanilla-query-order-key-case',
      'signrequest-get-unreserved',
      'signrequest-get-vanilla-query-unreserved',
      'signrequest-get-vanilla-ut8-query',
      'signrequest-get-utf8',
      'signrequest-get-space',
      'signrequest-post-vanilla-query-space',
      'signrequest-post-vanilla-query-nonunreserved',
      'signrequest-get-slash',
      'signrequest-get-slashes',
      'signrequest-get-slash-dot-slash',
      'signrequest-get-slash-pointless-dot',
      'signrequest-get-relative',
      'signrequest-get-relative-relative'
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
      'signrequest-only-sign-specified-headers',
      'signrequest-error-invalid-request-method',
      'signrequest-post-error-body-is-empty',
      'signrequest-error-invalid-request-url',
      'signrequest-error-post-missing-escher-key-in-config',
      'signrequest-signedheaders-downcase'
    ],
    presignUrl: [
      'presignurl-valid-with-path-query'
    ],
    authenticate: [
      'authenticate-valid-authentication-datein-expiretime',
      'authenticate-valid-get-vanilla-empty-query',
      'authenticate-valid-get-vanilla-empty-query-with-custom-headernames',
      'authenticate-valid-presigned-url-with-query',
      'authenticate-valid-ignore-headers-order',
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
      'authenticate-error-wrong-signature',
      'authenticate-error-presigned-url-expired',
      'authenticate-valid-credential-has-whitespace',
      'authenticate-error-invalid-request-method',
      'authenticate-error-post-body-is-null',
      'authenticate-error-invalid-request-url',
      'authenticate-error-presigned-url-invalid-escher-key'
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
