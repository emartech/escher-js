var config = {
    aws4: {
        files: [
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
            // 'get-header-key-duplicate',
            'post-header-key-case',
            'post-header-key-sort',
            // 'get-header-value-order',
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
        signerConfig: {
            hashAlgo: "sha256",
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request',
            apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
            accessKeyId: 'AKIDEXAMPLE'
        }
    },
    emarsys: {
        files: [
            'get-header-key-duplicate',
            'get-header-value-order',
            'post-header-key-order'
        ],
        signerConfig: {
            hashAlgo: "sha256",
            algoPrefix: 'AWS4',
            credentialScope: 'us-east-1/host/aws4_request',
            apiSecret: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
            accessKeyId: 'AKIDEXAMPLE'
        }
    }
};

module.exports = config;
