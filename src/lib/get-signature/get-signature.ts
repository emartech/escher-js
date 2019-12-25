import { EscherConfig, ValidRequest, RequestBody, RequestHeader, RequestHeaderValue } from '../../interface';
import {
  reduce,
  split,
  join,
  defaultTo,
  pipe,
  map,
  head,
  filter,
  includes,
  groupBy,
  isEmpty,
  toPairs,
  sortBy,
} from 'ramda';
import { convertToAwsShortDate } from '../convert-to-aws-short-date';
import { getAuthorizationAlgo } from '../get-authorization-algo';
import { convertToAwsLongDate } from '../convert-to-aws-long-date';
import { createHash, createHmac } from 'crypto';
import { getUrlWithParsedQuery } from '../get-url-with-parsed-query';
import { normalize } from 'path';
import { getNormalizedHeaderName } from '../get-normalized-header-name';

export function getSignature(
  config: EscherConfig,
  date: Date,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
): string {
  const signingKey = getSigningKey(config, date);
  const stringToSign = getStringToSign(config, date, request, body, headersToSign);
  return hmac(config.hashAlgo, signingKey, stringToSign).toString('hex') as string;
}

function getSigningKey(config: EscherConfig, date: Date): Buffer {
  return reduce(
    (signingKey, data) => hmac(config.hashAlgo, signingKey, data),
    Buffer.from(`${config.algoPrefix}${config.apiSecret}`),
    [convertToAwsShortDate(date), ...split('/', config.credentialScope)],
  );
}

function getStringToSign(
  config: EscherConfig,
  date: Date,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
): string {
  return join('\n', [
    getAuthorizationAlgo(config),
    convertToAwsLongDate(date),
    `${convertToAwsShortDate(date)}/${config.credentialScope}`,
    getCanonicalizedRequestChecksum(config, request, body, headersToSign),
  ]);
}
function getCanonicalizedRequestChecksum(
  config: EscherConfig,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
): string {
  return hash(config.hashAlgo, getCanonicalizeRequest(config, request, body, headersToSign));
}

function hash(algorithm: string, data: string): string {
  return createHash(algorithm)
    .update(data, 'utf8')
    .digest('hex');
}

function hmac(algorithm: string, key: Buffer, data: string): Buffer {
  return createHmac(algorithm, key)
    .update(data, 'utf8')
    .digest();
}

function getCanonicalizeRequest(
  config: EscherConfig,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
): string {
  const url = getUrlWithParsedQuery(request.url);
  const normalizedHeaders = getNormalizedHeaders(getSigneableHeaders(request.headers, headersToSign));
  const path = normalize(defaultTo('', url.pathname));
  const query = canonicalizeQuery(url.query);
  const headers = pipe(
    map(join(':')),
    join('\n'),
  )(normalizedHeaders);
  const headerNames = pipe(
    map(head),
    join(';'),
  )(normalizedHeaders);
  const bodyChecksum = hash(config.hashAlgo, body.toString());
  return join('\n', [request.method, path, query, headers, '', headerNames, bodyChecksum]);
}

function getSigneableHeaders(headers: RequestHeader[], headersToSign: string[]): RequestHeader[] {
  const normalizedHeadersToSign = map(getNormalizedHeaderName, headersToSign);
  return filter(([headerName]) => includes(getNormalizedHeaderName(headerName), normalizedHeadersToSign), headers);
}

function getNormalizedHeaders(headers: RequestHeader[]): RequestHeader[] {
  return (pipe as any)(
    groupBy(
      pipe(
        head,
        getNormalizedHeaderName,
      ),
    ),
    map(
      reduce((headerValues, [, headerValue]) => {
        const normalizedValue = getNormalizedHeaderValue(headerValue);
        return isEmpty(headerValues) ? normalizedValue : `${headerValues},${normalizedValue}`;
      }, ''),
    ),
    toPairs,
    sortBy(head),
  )(headers);
}

function getNormalizedHeaderValue(headerValue: RequestHeaderValue): string {
  return headerValue
    .toString()
    .trim()
    .split('"')
    .map((piece: any, index: any) => {
      const isInsideOfQuotes = index % 2 === 1;
      return isInsideOfQuotes ? piece : piece.replace(/\s+/, ' ');
    })
    .join('"');
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
