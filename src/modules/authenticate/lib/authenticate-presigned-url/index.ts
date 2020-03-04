export { createAuthenticatePresignedUrl } from './authenticate-presigned-url';
import { getUrlWithParsedQuery } from '../../../../lib';
import { checkMandatorySignHeaders } from '../check-mandatory-sign-headers';
import { checkSignatureConfig } from '../check-signature-config';
import { checkRequestDate } from '../check-request-date';
import { checkSignature } from '../check-signature';
import { getSignatureConfig } from '../get-signature-config';
import { getSignedHeadersFromQuery } from '../get-signed-headers-from-query';
import { createAuthenticatePresignedUrl } from './authenticate-presigned-url';
import { getAccessKeyId } from '../get-access-key-id';

export const authenticatePresignedUrl = createAuthenticatePresignedUrl({
  getUrlWithParsedQuery,
  getSignedHeadersFromQuery: getSignedHeadersFromQuery,
  getSignatureConfig,
  checkMandatorySignHeaders,
  checkSignatureConfig,
  checkRequestDate,
  checkSignature,
  getAccessKeyId,
});
