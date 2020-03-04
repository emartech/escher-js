import { getUrlWithParsedQuery } from '../../../../lib';
import { AuthenticateConfig, ValidRequest } from '../../../../interface';
import { split } from 'ramda';
import { ParsedUrlQuery } from 'querystring';
import { checkMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { checkSignatureConfig } from '../check-signature-config';
import { getQueryPart } from '../get-query-part';
import { checkRequestDate } from '../check-request-date';
import { checkSignature } from '../check-signature';
import { getSignatureConfig } from '../get-signature-config';
import { getAccessKeyId } from '../get-access-key-id';

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

function getSignedHeaders(config: AuthenticateConfig, query: ParsedUrlQuery): string[] {
  return split(';', getQueryPart(config, query, 'SignedHeaders'));
}
