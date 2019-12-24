import { RequestHeader, EscherConfig, ValidRequest, RequestBody, RequestHeaderValue } from '../../../interface';
import {
  pipe,
  map,
  uniq,
  join,
  comparator,
  lt,
  sort,
  reduce,
  split,
  defaultTo,
  filter,
  includes,
  groupBy,
  head,
  isEmpty,
  toPairs,
  sortBy,
  replace,
} from 'ramda';
import { convertToAwsShortDate } from '../convert-to-aws-short-date';
import { getNormalizedHeaderName } from '../get-normalized-header-name';
import { convertToAwsLongDate } from '../convert-to-aws-long-date';
import { createHash, createHmac } from 'crypto';
import { parse, UrlWithParsedQuery } from 'url';
import { normalize } from 'path';

export type GetAuthorizationHeader = (
  config: EscherConfig,
  date: Date,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
) => RequestHeader;

export const getAuthorizationHeader: GetAuthorizationHeader = (config, date, request, body, headersToSign) => {
  const headerName = getNormalizedHeaderName(config.authHeaderName);
  const headerValue = getHeaderValue(config, date, request, body, headersToSign);
  return [headerName, headerValue];
};

function getHeaderValue(
  config: EscherConfig,
  date: Date,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
): string {
  const authorizationAlgo = getAuthorizationAlgo(config);
  const credential = getCredential(config, date);
  const signedHeaders = getSignedHeaders(headersToSign);
  const signature = getSignature(config, date, request, body, headersToSign);
  return `${authorizationAlgo} Credential=${credential}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function getAuthorizationAlgo({ algoPrefix, hashAlgo }: EscherConfig): string {
  return `${algoPrefix}-HMAC-${hashAlgo}`;
}

function getCredential({ accessKeyId, credentialScope }: EscherConfig, date: Date): string {
  return `${accessKeyId}/${convertToAwsShortDate(date)}/${credentialScope}`;
}

function getSignedHeaders(headersToSign: string[]): string {
  return pipe(
    map<string, string>(getNormalizedHeaderName),
    uniq as any,
    sort(comparator(lt)),
    join(';'),
  )(headersToSign);
}

function getSignature(
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
  const url = getUrlWithParsedQuery(request);
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

function getUrlWithParsedQuery(request: ValidRequest): UrlWithParsedQuery {
  // https://github.com/joyent/node/blob/4b59db008cec1bfcca2783f4b27c630c9c3fdd73/lib/url.js#L113-L117
  const url = pipe(
    replace('#', '%23'),
    replace('\\', '%5C'),
  )(request.url);
  const parseQueryString = true;
  return parse(url, parseQueryString);
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
