import { EscherConfig, EscherRequest, PresignUrl } from '../../interface';
import {
  getUrlWithParsedQuery,
  convertToAwsLongDate,
  getAuthorizationAlgo,
  getCredential,
  getSignedHeaders,
  getSignature,
} from '../../lib';
import { format, UrlWithParsedQuery } from 'url';
import { map, pipe, toPairs, fromPairs, defaultTo, pick } from 'ramda';
import { ParsedUrlQuery } from 'querystring';

export const presignUrl: PresignUrl = (config, url, expiration, date) => {
  const headersToSign = ['host'];
  const parsedNewUrl = getParsedUrlWithAppendedQuery(
    getUrlWithParsedQuery(url),
    getVendorKeyPrefixedQuery(config, {
      Algorithm: getAuthorizationAlgo(config),
      Credentials: getCredential(config, date),
      Date: convertToAwsLongDate(date),
      Expires: expiration.toString(),
      SignedHeaders: getSignedHeaders(headersToSign),
    }),
  );

  const request: EscherRequest = {
    method: 'GET',
    url: defaultTo('', parsedNewUrl.path),
    headers: [['Host', defaultTo('', parsedNewUrl.host)]],
  };

  const signature = getSignature(config, date, request, 'UNSIGNED-PAYLOAD', headersToSign);

  return format(
    getParsedUrlWithAppendedQuery(parsedNewUrl, getVendorKeyPrefixedQuery(config, { Signature: signature })),
  );
};

function getVendorKeyPrefixedQuery({ vendorKey }: EscherConfig, query: ParsedUrlQuery): ParsedUrlQuery {
  return (pipe as any)(toPairs, map(([key, value]) => [`X-${vendorKey}-${key}`, value]), fromPairs)(query);
}

function getParsedUrlWithAppendedQuery(
  urlWithParsedQuery: UrlWithParsedQuery,
  query: ParsedUrlQuery,
): UrlWithParsedQuery {
  const url = format({
    ...pick(['protocol', 'hostname', 'pathname', 'host'], urlWithParsedQuery),
    query: { ...urlWithParsedQuery.query, ...query },
  });
  return getUrlWithParsedQuery(url);
}
