import { GetUrlWithParsedQuery } from '../../../../lib';
import { AuthenticateConfig, EscherRequest } from '../../../../interface';
import { CheckMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { CheckSignatureConfig } from '../check-signature-config';
import { getQueryPart } from '../get-query-part';
import { CheckRequestDate } from '../check-request-date';
import { CheckSignature } from '../check-signature';
import { GetSignatureConfigFromQuery } from '../get-signature-config-from-query';
import { GetAccessKeyId } from '../get-access-key-id';
import { GetSignedHeadersFromQuery } from '../get-signed-headers-from-query';

export type AuthenticatePresignedUrlStrategy = {
  getUrlWithParsedQuery: GetUrlWithParsedQuery;
  getSignedHeadersFromQuery: GetSignedHeadersFromQuery;
  getSignatureConfig: GetSignatureConfigFromQuery;
  checkMandatorySignHeaders: CheckMandatorySignHeaders;
  checkSignatureConfig: CheckSignatureConfig;
  checkRequestDate: CheckRequestDate;
  checkSignature: CheckSignature;
  getAccessKeyId: GetAccessKeyId;
};

export type AuthenticatePresignedUrl = (
  config: AuthenticateConfig,
  request: EscherRequest,
  keyDB: Function,
  mandatorySignedHeaders: string[],
  currentDate: Date,
) => string;

export const createAuthenticatePresignedUrl = (
  strategy: AuthenticatePresignedUrlStrategy,
): AuthenticatePresignedUrl => (config, request, keyDB, mandatorySignedHeaders, currentDate) => {
  const urlWithParsedQuery = strategy.getUrlWithParsedQuery(request.url);
  const { query } = urlWithParsedQuery;
  const signedHeaders = strategy.getSignedHeadersFromQuery(config, query);
  const signatureConfig = strategy.getSignatureConfig(config, query, keyDB);
  strategy.checkMandatorySignHeaders(signedHeaders, [...mandatorySignedHeaders, 'host']);
  strategy.checkSignatureConfig(config, signatureConfig);
  strategy.checkRequestDate(
    config,
    getQueryPart(config, query, 'Credentials'),
    getQueryPart(config, query, 'Date'),
    parseInt(getQueryPart(config, query, 'Expires')),
    currentDate,
  );
  strategy.checkSignature(config, signatureConfig, urlWithParsedQuery, request, signedHeaders);
  return strategy.getAccessKeyId(getQueryPart(config, query, 'Credentials'));
};
