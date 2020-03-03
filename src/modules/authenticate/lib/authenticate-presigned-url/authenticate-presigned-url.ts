import { getUrlWithParsedQuery, convertToAwsShortDate, getSignature } from '../../../../lib';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { EscherConfig, ValidRequest, SignatureConfig } from '../../../../interface';
import { split, pipe, join, last, fromPairs, toPairs, filter } from 'ramda';
import { ParsedUrlQuery } from 'querystring';
import { UrlWithParsedQuery } from 'url';
import { canonicalizeQuery } from '../../../../lib/canonicalize-query/canonicalize-query';
import { checkMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { checkSignatureConfig } from '../check-signature-config';

export const authenticatePresignedUrl = (
  config: any,
  request: any,
  keyDB: any,
  mandatorySignedHeaders: any,
  currentDate: any,
) => {
  const urlWithParsedQuery = getUrlWithParsedQuery(request.url);
  const signedHeaders = getSignedHeaders(config, urlWithParsedQuery.query);
  const signatureConfig = getSignatureConfig(config, urlWithParsedQuery.query, keyDB);
  checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders);
  checkSignatureConfig(config, signatureConfig);
  checkRequestDate(config, urlWithParsedQuery.query, currentDate);
  checkSignature(config, signatureConfig, urlWithParsedQuery, request, signedHeaders);
  return getAccessKeyId(getQueryPart(config, urlWithParsedQuery.query, 'Credentials'));
};

function getSignedHeaders(config: EscherConfig, query: ParsedUrlQuery): string[] {
  return split(';', getQueryPart(config, query, 'SignedHeaders'));
}

function getQueryPart(config: any, query: any, key: any): any {
  return query['X-' + config.vendorKey + '-' + key] || '';
}

function getSignatureConfig({ vendorKey, algoPrefix }: any, query: ParsedUrlQuery, keyDB: Function): SignatureConfig {
  const credentials = getQueryPart({ vendorKey }, query, 'Credentials');
  const apiSecret = getApiSecret(credentials, keyDB);
  const credentialScope = getCredentialScope(credentials);
  const hashAlgo = getHashAlgorithm(getQueryPart({ vendorKey }, query, 'Algorithm')) as any;
  return { algoPrefix, apiSecret, credentialScope, hashAlgo };
}

function getApiSecret(credentials: string, keyDB: Function): string {
  const accessKeyId = getAccessKeyId(credentials);
  return keyDB(accessKeyId);
}

function getAccessKeyId(credentials: string): string | undefined {
  const [accessKeyId] = split('/', credentials);
  return accessKeyId;
}

function getCredentialScope(credentials: string): string {
  const [, , ...credentialScopeParts] = split('/', credentials);
  return join('/', credentialScopeParts);
}

function getHashAlgorithm(algorithm: string): string {
  return last(split('-', algorithm))!;
}

function checkRequestDate(config: any, query: ParsedUrlQuery, currentDate: Date): void {
  const credentials = getQueryPart(config, query, 'Credentials');
  const shortDate = getShortDate(credentials);
  const requestDate = parseLongDate(getQueryPart(config, query, 'Date'));
  if (!isEqualFixedTime(shortDate!, convertToAwsShortDate(requestDate))) {
    throw new Error('Invalid date in authorization header, it should equal with date header');
  }

  const requestTime = requestDate.getTime();
  const currentTime = currentDate.getTime();
  const expires = parseInt(getQueryPart(config, query, 'Expires'));
  if (!isDateWithinRange(config, requestTime, currentTime, expires)) {
    throw new Error('The request date is not within the accepted time range');
  }
}

function getShortDate(credentials: string): string | undefined {
  const [, shortDate] = split('/', credentials);
  return shortDate;
}

function parseLongDate(longDate: any): any {
  const longDateRegExp = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/;
  const m = longDate.match(longDateRegExp);
  if (!m) {
    throw new Error('Invalid date header, expected format is: 20151104T092022Z');
  }

  return new Date(m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6] + ' GMT');
}

function isDateWithinRange(config: any, requestTime: any, currentTime: any, expires: any): any {
  return (
    requestTime - config.clockSkew * 1000 <= currentTime &&
    currentTime < requestTime + expires * 1000 + config.clockSkew * 1000
  );
}

function checkSignature(
  config: any,
  signatureConfig: SignatureConfig,
  urlWithParsedQuery: UrlWithParsedQuery,
  request: ValidRequest,
  signedHeaders: string[],
): void {
  const requestDate = parseLongDate(getQueryPart(config, urlWithParsedQuery.query, 'Date'));
  const requestBody = 'UNSIGNED-PAYLOAD';
  const requestWithCanonicalizedUrl = canonicalizedRequestUrl(urlWithParsedQuery, request);
  const generatedSignature = getSignature(
    signatureConfig,
    requestDate,
    requestWithCanonicalizedUrl,
    requestBody,
    signedHeaders,
  );
  if (!isEqualFixedTime(getQueryPart(config, urlWithParsedQuery.query, 'Signature'), generatedSignature)) {
    throw new Error('The signatures do not match');
  }
}

function canonicalizedRequestUrl(urlWithParsedQuery: UrlWithParsedQuery, request: ValidRequest): ValidRequest {
  const canonicalizedQueryString = canonicalizeQuery(dropSignature(urlWithParsedQuery.query));
  return {
    ...request,
    url: urlWithParsedQuery.pathname + (canonicalizedQueryString ? '?' + canonicalizedQueryString : ''),
  };
}

function dropSignature(query: ParsedUrlQuery): ParsedUrlQuery {
  return (pipe as any)(toPairs, filter(([key]) => last(split('-', key)) !== 'Signature'), fromPairs)(query);
}
