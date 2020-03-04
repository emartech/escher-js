import { GetUrlWithParsedQuery } from '../../../../lib';
import { AuthenticateConfig, ValidRequest } from '../../../../interface';
import { CheckMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { CheckSignatureConfig } from '../check-signature-config';
import { getQueryPart } from '../get-query-part';
import { CheckRequestDate } from '../check-request-date';
import { CheckSignature } from '../check-signature';
import { GetSignatureConfig } from '../get-signature-config';
import { GetAccessKeyId } from '../get-access-key-id';
import { GetSignedHeadersFromQuery } from '../get-signed-headers-from-query';

export type AuthenticatePresignedUrlStrategy = {
  getUrlWithParsedQuery: GetUrlWithParsedQuery;
  getSignedHeadersFromQuery: GetSignedHeadersFromQuery;
  getSignatureConfig: GetSignatureConfig;
  checkMandatorySignHeaders: CheckMandatorySignHeaders;
  checkSignatureConfig: CheckSignatureConfig;
  checkRequestDate: CheckRequestDate;
  checkSignature: CheckSignature;
  getAccessKeyId: GetAccessKeyId;
};

export type AuthenticatePresignedUrl = (
  config: AuthenticateConfig,
  request: ValidRequest,
  keyDB: Function,
  mandatorySignedHeaders: string[],
  currentDate: Date,
) => string;

export const createAuthenticatePresignedUrl = (
  strategy: AuthenticatePresignedUrlStrategy,
): AuthenticatePresignedUrl => (config, request, keyDB, mandatorySignedHeaders, currentDate) => {
  const urlWithParsedQuery = strategy.getUrlWithParsedQuery(request.url);
  const signedHeaders = strategy.getSignedHeadersFromQuery(config, urlWithParsedQuery.query);
  const signatureConfig = strategy.getSignatureConfig(config, urlWithParsedQuery.query, keyDB);
  strategy.checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders);
  strategy.checkSignatureConfig(config, signatureConfig);
  strategy.checkRequestDate(config, urlWithParsedQuery.query, currentDate);
  strategy.checkSignature(config, signatureConfig, urlWithParsedQuery, request, signedHeaders);
  return strategy.getAccessKeyId(getQueryPart(config, urlWithParsedQuery.query, 'Credentials'));
};
