import { RequestHeader, EscherConfig, ValidRequest, RequestBody } from '../../../interface';
import { toLower, pipe, map, uniq, join, comparator, lt, sort } from 'ramda';
import Signer = require('../../../signer');
import { convertToAwsShortDate } from '../convert-to-aws-short-date';
import { getNormalizedHeaderName } from '../get-normalized-header-name';

export type GetAuthorizationHeader = (
  config: EscherConfig,
  date: Date,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
) => RequestHeader;

export const getAuthorizationHeader: GetAuthorizationHeader = (config, date, request, body, headersToSign) => {
  const headerName = toLower(config.authHeaderName);
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
  const signer = new Signer(config, date);
  return signer.calculateSignature(
    signer.getStringToSign(request, body, headersToSign),
    signer.calculateSigningKey(),
  ) as any;
}
