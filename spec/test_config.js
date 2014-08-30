
var testFiles = [
    'aws4:get-vanilla',
    'aws4:post-vanilla',
    'aws4:get-vanilla-query',
    'aws4:post-vanilla-query',
    'aws4:get-vanilla-empty-query-key',
    'aws4:post-vanilla-empty-query-value',
    'aws4:get-vanilla-query-order-key',
    'aws4:post-x-www-form-urlencoded',
    'aws4:post-x-www-form-urlencoded-parameters',
    'aws4:get-header-value-trim',
    // 'aws4:get-header-key-duplicate',
    'aws4:post-header-key-case',
    'aws4:post-header-key-sort',
    // 'aws4:get-header-value-order',
    'aws4:post-header-value-case',
    'aws4:get-vanilla-query-order-value',
    'aws4:get-vanilla-query-order-key-case',
    'aws4:get-unreserved',
    'aws4:get-vanilla-query-unreserved',
    'aws4:get-vanilla-ut8-query',
    'aws4:get-utf8',
    'aws4:get-space',
    'aws4:post-vanilla-query-space',
    'aws4:post-vanilla-query-nonunreserved',
    'aws4:get-slash',
    'aws4:get-slashes',
    'aws4:get-slash-dot-slash',
    'aws4:get-slash-pointless-dot',
    'aws4:get-relative',
    'aws4:get-relative-relative',
    'emarsys:get-header-key-duplicate',
    'emarsys:get-header-value-order'
];

module.exports = {
    testFiles: testFiles
};