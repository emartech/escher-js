import { getUrlWithParsedQuery, convertToAwsShortDate, getSignature, getNormalizedHeaderName } from '../../../../lib';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { EscherConfig } from '../../../../interface';
import { split, defaultTo, pipe, append, map, forEach, includes } from 'ramda';
import { ParsedUrlQuery } from 'querystring';

export const authenticatePresignedUrl = (
  config: any,
  request: any,
  keyDB: any,
  mandatorySignedHeaders: any,
  currentDate: any,
) => {
  const url = getUrlWithParsedQuery(request.url);
  const signedHeaders = getSignedHeaders(config, url.query);

  const requestDate = parseLongDate(url.query[getParamKey(config, 'Date')] as string);
  const parsedAuthParts = parseFromQuery(config, url.query, keyDB);
  const requestBody = 'UNSIGNED-PAYLOAD';
  const expires = parseInt(url.query[getParamKey(config, 'Expires')] as string);
  const canonicalizedQueryString = canonicalizeQuery(filterKeysFrom(url.query, [getParamKey(config, 'Signature')]));
  request.url = url.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');

  checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders);

  if (!isEqualFixedTime(parsedAuthParts.config.credentialScope, config.credentialScope)) {
    throw new Error('Invalid Credential Scope');
  }

  if (!['SHA256', 'SHA512'].includes(parsedAuthParts.config.hashAlgo)) {
    throw new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed');
  }

  if (!isEqualFixedTime(parsedAuthParts.shortDate, convertToAwsShortDate(requestDate))) {
    throw new Error('Invalid date in authorization header, it should equal with date header');
  }

  const requestTime = requestDate.getTime();
  const currentTime = currentDate.getTime();
  if (!isDateWithinRange(config, requestTime, currentTime, expires)) {
    throw new Error('The request date is not within the accepted time range');
  }

  const generatedSignature = getSignature(parsedAuthParts.config, requestDate, request, requestBody, signedHeaders);
  if (!isEqualFixedTime(parsedAuthParts.signature, generatedSignature)) {
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

function parseFromQuery(config: any, query: any, keyDB: any): any {
  const credentialRegExpDefinition = '([A-Za-z0-9\\-_]+)/([0-9]{8})/([A-Za-z0-9\\-_ /]+)';
  // eslint-disable-next-line security/detect-non-literal-regexp
  const credentialParts = getQueryPart(config, query, 'Credentials').match(new RegExp(credentialRegExpDefinition));
  const algoRegExp = config.algoPrefix + '-HMAC-([A-Za-z0-9\\,]+)';
  const parsedConfig = {
    vendorKey: config.vendorKey,
    algoPrefix: config.algoPrefix,
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

function getSignedHeaders(config: EscherConfig, query: ParsedUrlQuery): string[] {
  return split(';', getQueryPart(config, query, 'SignedHeaders'));
}

function checkMandatorySignHeaders(signedHeaders: string[], mandatorySignedHeaders: string[]): void {
  pipe(
    defaultTo([]),
    append('host') as any,
    map(getNormalizedHeaderName),
    forEach(mandatoryHeader => {
      if (!includes(mandatoryHeader, signedHeaders)) {
        throw new Error(`The ${mandatoryHeader} header is not signed`);
      }
    }),
  )(mandatorySignedHeaders);
}
