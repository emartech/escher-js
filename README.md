EscherJS - HTTP request signing lib [![Build Status](https://travis-ci.org/emartech/escher-js.svg?branch=master)](https://travis-ci.org/emartech/escher-js)
===================================

Escher helps you creating secure HTTP requests (for APIs) by signing HTTP(s) requests. It's both a server side and client side implementation. The status is work in progress.

The algorithm is based on [Amazon's _AWS Signature Version 4_](http://docs.aws.amazon.com/AmazonS3/latest/API/sig-v4-authenticating-requests.html), but we have generalized and extended it.

More details are available at our [Escher documentation site](http://escherauth.io/).

## Development

The [Test Cases](https://github.com/EscherAuth/test-cases) are included as a git submodule.

Don't forget to use the `git submodule init` and the `git submodule update` to pull and clone the testcases.
