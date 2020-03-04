import { SignatureConfig, ValidRequest } from '../../../../interface';
import { UrlWithParsedQuery } from 'url';
import { getQueryPart } from '../get-query-part';
import { parseLongDate } from '../parse-long-date';
import { getSignature, canonicalizeQuery } from '../../../../lib';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { ParsedUrlQuery } from 'querystring';
import { pipe, toPairs, filter, last, split, fromPairs } from 'ramda';

export function checkSignature(
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