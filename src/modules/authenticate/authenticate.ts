import { validateRequest } from '../validate-request';
import { validateMandatorySignedHeaders } from '../validate-mandatory-signed-headers';
import { getUrlWithParsedQuery, convertToAwsShortDate, getSignature } from '../../lib';
import crypto = require('crypto');

export const authenticate = (config: any, request: any, keyDB: any, mandatorySignedHeaders: any) => {
  const currentDate = new Date();
  validateRequest(request);
  validateMandatorySignedHeaders(mandatorySignedHeaders);
  const uri = getUrlWithParsedQuery(request.url);
  const isPresignedUrl =
    Object.prototype.hasOwnProperty.call(uri.query, getParamKey(config, 'Signature')) && request.method === 'GET';

  let requestDate: any;
  let parsedAuthParts: any;
  let requestBody: any;
  let expires: any;
  if (isPresignedUrl) {
    requestDate = parseLongDate(uri.query[getParamKey(config, 'Date')] as string);
    parsedAuthParts = parseFromQuery(config, uri.query, requestDate, keyDB);
    requestBody = 'UNSIGNED-PAYLOAD';
    expires = parseInt(uri.query[getParamKey(config, 'Expires')] as string);
    const canonicalizedQueryString = canonicalizeQuery(filterKeysFrom(uri.query, [getParamKey(config, 'Signature')]));
    request.url = uri.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');
  } else {
    requestDate =
      config.dateHeaderName.toLowerCase() === 'date'
        ? new Date(getHeader(request, config.dateHeaderName))
        : parseLongDate(getHeader(request, config.dateHeaderName));
    parsedAuthParts = parseAuthHeader(config, getHeader(request, config.authHeaderName), requestDate, keyDB);
    requestBody = request.body || '';
    expires = 0;
  }

  if (!request.host) {
    request.host = getHeader(request, 'host');
  }

  if (!mandatorySignedHeaders) {
    mandatorySignedHeaders = [];
  }
  mandatorySignedHeaders.push('host');
  if (!isPresignedUrl) {
    mandatorySignedHeaders.push(config.dateHeaderName.toLowerCase());
  }
  mandatorySignedHeaders.forEach((mandatoryHeader: any) => {
    if (!parsedAuthParts.signedHeaders.includes(mandatoryHeader.toLowerCase())) {
      throw new Error('The ' + mandatoryHeader + ' header is not signed');
    }
  });

  if (!fixedTimeComparison(parsedAuthParts.config.credentialScope, config.credentialScope)) {
    throw new Error('Invalid Credential Scope');
  }

  if (!['SHA256', 'SHA512'].includes(parsedAuthParts.config.hashAlgo)) {
    throw new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed');
  }

  if (!fixedTimeComparison(parsedAuthParts.shortDate, convertToAwsShortDate(requestDate))) {
    throw new Error('Invalid date in authorization header, it should equal with date header');
  }

  const requestTime = requestDate.getTime();
  const currentTime = currentDate.getTime();
  if (!isDateWithinRange(config, requestTime, currentTime, expires)) {
    throw new Error('The request date is not within the accepted time range');
  }

  const generatedAuthParts = getSignature(
    parsedAuthParts.config,
    requestDate,
    request,
    requestBody,
    parsedAuthParts.signedHeaders,
  );
  if (!fixedTimeComparison(parsedAuthParts.signature, generatedAuthParts)) {
    throw new Error('The signatures do not match');
  }

  return parsedAuthParts.config.accessKeyId;
};

function getParamKey(config: any, paramName: any): any {
  return ['X', config.vendorKey, paramName].join('-');
}

function isDateWithinRange(config: any, requestTime: any, currentTime: any, expires: any): any {
  return (
    requestTime - config.clockSkew * 1000 <= currentTime &&
    currentTime < requestTime + expires * 1000 + config.clockSkew * 1000
  );
}

function parseLongDate(longDate: any): any {
  const longDateRegExp = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;
  const m = longDate.match(longDateRegExp);
  if (!m) {
    throw new Error('Invalid date header, expected format is: 20151104T092022Z');
  }

  return new Date(m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6] + ' GMT');
}

function fixedTimeComparison(a: any, b: any): any {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (err) {
    return false;
  }
}

function getHeader(request: any, headerName: any): any {
  headerName = headerName.toLowerCase();
  if (request.headers instanceof Array) {
    for (let i = 0, j = request.headers.length; i < j; i++) {
      if (request.headers[i][0].toLowerCase() === headerName) {
        return request.headers[i][1];
      }
    }
  } else {
    if (request.headers.hasOwnProperty(headerName)) {
      return request.headers[headerName];
    }
  }

  throw new Error('The ' + headerName + ' header is missing');
}

function filterKeysFrom(hash: any, keysToFilter: any): any {
  const result: any = {};
  Object.keys(hash).forEach(key => {
    if (!keysToFilter.includes(key)) {
      result[key] = hash[key];
    }
  });

  return result;
}

function canonicalizeQuery(query: any): any {
  const encodeComponent = (component: any) =>
    encodeURIComponent(component)
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');

  const join = (key: any, value: any) => encodeComponent(key) + '=' + encodeComponent(value);

  return Object.keys(query)
    .map(key => {
      const value = query[key];
      if (typeof value === 'string') {
        return join(key, value);
      }
      return value
        .sort()
        .map((oneValue: any) => join(key, oneValue))
        .join('&');
    })
    .sort()
    .join('&');
}

function parseFromQuery(config: any, query: any, requestDate: any, keyDB: any): any {
  const credentialRegExpDefinition = '([A-Za-z0-9\\-_]+)/([0-9]{8})/([A-Za-z0-9\\-_ /]+)';
  // eslint-disable-next-line security/detect-non-literal-regexp
  const credentialParts = getQueryPart(config, query, 'Credentials').match(new RegExp(credentialRegExpDefinition));
  const algoRegExp = config.algoPrefix + '-HMAC-([A-Za-z0-9\\,]+)';
  const parsedConfig = {
    vendorKey: config.vendorKey,
    algoPrefix: config.algoPrefix,
    date: requestDate,
    // eslint-disable-next-line security/detect-non-literal-regexp
    hashAlgo: getQueryPart(config, query, 'Algorithm').match(new RegExp(algoRegExp))[1],
    accessKeyId: credentialParts[1],
    apiSecret: keyDB(credentialParts[1]),
    credentialScope: credentialParts[3],
  };

  if (typeof parsedConfig.apiSecret !== 'string') {
    throw new Error('Invalid Escher key');
  }

  return {
    shortDate: credentialParts[2],
    config: parsedConfig,
    signedHeaders: getQueryPart(config, query, 'SignedHeaders').split(';'),
    signature: getQueryPart(config, query, 'Signature'),
    expires: getQueryPart(config, query, 'Expires'),
  };
}

function getQueryPart(config: any, query: any, key: any): any {
  return query['X-' + config.vendorKey + '-' + key] || '';
}

function parseAuthHeader(config: any, authHeader: any, requestDate: any, keyDB: any): any {
  const algoRegExp = config.algoPrefix + '-HMAC-([A-Za-z0-9\\,]+)';
  const credentialRegExpDefinition = '([A-Za-z0-9\\-_]+)/([0-9]{8})/([A-Za-z0-9\\-_ /]+)';
  const signedHeadersRegExpDefinition = '([A-Za-z\\-;]+)';
  const signatureRegExpDefinition = '([0-9a-f]+)';
  // eslint-disable-next-line security/detect-non-literal-regexp
  const regex = new RegExp(
    '^' +
      algoRegExp +
      ' Credential=' +
      credentialRegExpDefinition +
      ', SignedHeaders=' +
      signedHeadersRegExpDefinition +
      ', Signature=' +
      signatureRegExpDefinition +
      '$',
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
    credentialScope: matches[4],
  };

  if (typeof parsedConfig.apiSecret !== 'string') {
    throw new Error('Invalid Escher key');
  }

  return {
    shortDate: matches[3],
    config: parsedConfig,
    signedHeaders: matches[5].split(';'),
    signature: matches[6],
  };
}
