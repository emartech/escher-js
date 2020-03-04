import { getUrlWithParsedQuery } from '../../../../lib';
import { EscherConfig, SignatureConfig, AuthenticateConfig, ValidRequest } from '../../../../interface';
import { split, join, last } from 'ramda';
import { ParsedUrlQuery } from 'querystring';
import { checkMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { checkSignatureConfig } from '../check-signature-config';
import { getQueryPart } from '../get-query-part';
import { checkRequestDate } from '../check-request-date';
import { checkSignature } from '../check-signature';

export const authenticatePresignedUrl = (
  config: AuthenticateConfig,
  request: ValidRequest,
  keyDB: Function,
  mandatorySignedHeaders: string[],
  currentDate: Date,
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

function getSignatureConfig(
  { vendorKey, algoPrefix }: AuthenticateConfig,
  query: ParsedUrlQuery,
  keyDB: Function,
): SignatureConfig {
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
