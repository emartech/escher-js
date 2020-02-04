import { getUrlWithParsedQuery, convertToAwsShortDate, getSignature, getNormalizedHeaderName } from '../../../../lib';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { EscherConfig } from '../../../../interface';
import { split, defaultTo, pipe, append, map, forEach, includes, join, last } from 'ramda';
import { ParsedUrlQuery } from 'querystring';

export const authenticatePresignedUrl = (
  config: any,
  request: any,
  keyDB: any,
  mandatorySignedHeaders: any,
  currentDate: any,
) => {
  const urlWithParsedQuery = getUrlWithParsedQuery(request.url);
  const signedHeaders = getSignedHeaders(config, urlWithParsedQuery.query);

  const requestDate = parseLongDate(urlWithParsedQuery.query[getParamKey(config, 'Date')] as string);
  const parsedAuthParts = parseFromQuery(config, urlWithParsedQuery.query, keyDB);
  const requestBody = 'UNSIGNED-PAYLOAD';
  const expires = parseInt(urlWithParsedQuery.query[getParamKey(config, 'Expires')] as string);
  const canonicalizedQueryString = canonicalizeQuery(
    filterKeysFrom(urlWithParsedQuery.query, [getParamKey(config, 'Signature')]),
  );
  request.url = urlWithParsedQuery.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : '');

  checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders);

  if (typeof parsedAuthParts.config.apiSecret !== 'string') {
    throw new Error('Invalid Escher key');
  }

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
  const credentials = getQueryPart(config, query, 'Credentials');
  const algorithm = getQueryPart(config, query, 'Algorithm');
  const accessKeyId = getAccessKeyId(credentials);
  const apiSecret = keyDB(accessKeyId);
  const credentialScope = getCredentialScope(credentials);
  const shortDate = getShortDate(credentials);
  const hashAlgo = getHashAlgorithm(algorithm);
  return {
    shortDate,
    config: {
      vendorKey: config.vendorKey,
      algoPrefix: config.algoPrefix,
      hashAlgo,
      accessKeyId,
      apiSecret,
      credentialScope,
    },
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

function getAccessKeyId(credentials: string): string | undefined {
  const [accessKeyId] = split('/', credentials);
  return accessKeyId;
}

function getCredentialScope(credentials: string): string {
  const [, , ...credentialScopeParts] = split('/', credentials);
  return join('/', credentialScopeParts);
}

function getShortDate(credentials: string): string | undefined {
  const [, shortDate] = split('/', credentials);
  return shortDate;
}

function getHashAlgorithm(algorithm: string): string | undefined {
  return last(split('-', algorithm));
}
