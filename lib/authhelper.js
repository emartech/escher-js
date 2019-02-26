'use strict';

const Signer = require('./signer');
const Canonicalizer = require('./canonicalizer');
const utils = require('./utils');

const AuthHelper = function(config, currentDate) {

  function buildAuthParts(requestOptions, requestBody, headersToSign) {
    const signer = new Signer(config, currentDate);

    return {
      shortDate: utils.toShortDate(currentDate),
      signedHeaders: new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers, headersToSign),
      signature: signer.calculateSignature(signer.getStringToSign(requestOptions, requestBody, headersToSign), signer
        .calculateSigningKey())
    };
  }

  function buildHeader(authParts) {
    return [config.algoPrefix, 'HMAC', config.hashAlgo].join('-') +
      ' Credential=' + generateFullCredentials() +
      ', SignedHeaders=' + formatSignedHeaders(authParts.signedHeaders) +
      ', Signature=' + authParts.signature;
  }

  function generateHeader(requestOptions, body, headersToSign) {
    return buildHeader(buildAuthParts(requestOptions, body, headersToSign));
  }

  function generatePreSignedUrl(requestUrl, expires) {
    const parsedUrl = utils.parseUrl(requestUrl, true); // TODO apply fixed parse here too (?)
    const requestOptions = {
      host: parsedUrl.host,
      method: 'GET',
      url: parsedUrl.path,
      headers: [
        ['Host', parsedUrl.host]
      ]
    };

    const headersToSign = ['host'];
    const params = {
      Algorithm: [config.algoPrefix, 'HMAC', config.hashAlgo].join('-'),
      Credentials: generateFullCredentials(),
      Date: utils.toLongDate(currentDate),
      Expires: expires,
      SignedHeaders: formatSignedHeaders(new Canonicalizer().getCanonicalizedSignedHeaders(requestOptions.headers,
        headersToSign))
    };

    Object.keys(params).forEach(function(key) {
      requestUrl = appendQueryParamToUrl(requestUrl, getParamKey(key), params[key]);
    });

    requestOptions.url = utils.parseUrl(requestUrl, true).path;
    const signer = new Signer(config, currentDate);
    const signature = signer.calculateSignature(signer.getStringToSign(requestOptions, 'UNSIGNED-PAYLOAD',
      headersToSign), signer.calculateSigningKey());
    return appendQueryParamToUrl(requestUrl, getParamKey('Signature'), signature);
  }

  function getParamKey(paramName) {
    return ['X', config.vendorKey, paramName].join('-');
  }

  function appendQueryParamToUrl(url, key, value) {
    if (url.indexOf('?') !== -1) {
      url = url + '&';
    } else {
      url = url + '?';
    }

    return url + encodeURIComponent(key) + '=' + encodeURIComponent(value);
  }

  function generateFullCredentials() {
    return [config.accessKeyId, utils.toShortDate(currentDate), config.credentialScope].join('/');
  }

  function formatSignedHeaders(signedHeaders) {
    return signedHeaders.map(Function.prototype.call, String.prototype.toLowerCase).sort().join(';');
  }

  function algoRegExp() {
    return config.algoPrefix + '-HMAC-([A-Za-z0-9\\,]+)';
  }

  function credentialRegExp() {
    return '([A-Za-z0-9\\-_]+)\/([0-9]{8})\/([A-Za-z0-9\\-_ \/]+)';
  }

  function signedHeadersRegExp() {
    return '([A-Za-z\\-;]+)';
  }

  function signatureRegExp() {
    return '([0-9a-f]+)';
  }

  function getQueryPart(query, key) {
    return query['X-' + config.vendorKey + '-' + key] || '';
  }

  function parseAuthHeader(authHeader, requestDate, keyDB) {
    const regex = new RegExp('^' + algoRegExp() + ' Credential=' + credentialRegExp() + ', SignedHeaders=' +
      signedHeadersRegExp() + ', Signature=' + signatureRegExp() + '$'
    );
    const matches = authHeader.match(regex);

    if (!matches) {
      throw new Error('Invalid auth header format');
    }

    const parsedConfig = {
      vendorKey: config.vendorKey,
      algoPrefix: config.algoPrefix,
      date: requestDate,
      hashAlgo: matches[1],
      accessKeyId: matches[2],
      apiSecret: keyDB(matches[2]),
      credentialScope: matches[4]
    };

    if (typeof parsedConfig.apiSecret !== 'string') {
      throw new Error('Invalid Escher key');
    }

    return {
      shortDate: matches[3],
      config: parsedConfig,
      signedHeaders: matches[5].split(';'),
      signature: matches[6]
    };
  }

  function parseFromQuery(query, requestDate, keyDB) {
    const credentialParts = getQueryPart(query, 'Credentials').match(new RegExp(credentialRegExp()));
    const parsedConfig = {
      vendorKey: config.vendorKey,
      algoPrefix: config.algoPrefix,
      date: requestDate,
      hashAlgo: getQueryPart(query, 'Algorithm').match(new RegExp(algoRegExp()))[1],
      accessKeyId: credentialParts[1],
      apiSecret: keyDB(credentialParts[1]),
      credentialScope: credentialParts[3]
    };

    if (typeof parsedConfig.apiSecret !== 'string') {
      throw new Error('Invalid Escher key');
    }

    return {
      shortDate: credentialParts[2],
      config: parsedConfig,
      signedHeaders: getQueryPart(query, 'SignedHeaders').split(';'),
      signature: getQueryPart(query, 'Signature'),
      expires: getQueryPart(query, 'Expires')
    };
  }

  return {
    generateHeader: generateHeader,
    generatePreSignedUrl: generatePreSignedUrl,
    buildAuthParts: buildAuthParts,
    parseAuthHeader: parseAuthHeader,
    parseFromQuery: parseFromQuery
  };
};

module.exports = AuthHelper;
