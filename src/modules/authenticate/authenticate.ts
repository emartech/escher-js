import { validateRequest } from '../validate-request';
import { validateMandatorySignedHeaders } from '../validate-mandatory-signed-headers';
import { getUrlWithParsedQuery } from '../../lib';
import { isPresignedUrl, authenticatePresignedUrl } from './lib';
import { authenticateHeaders } from './lib/authenticate-headers';
import { AuthenticateConfig, ValidRequest } from '../../interface';

export type Authenticate = (
  config: AuthenticateConfig,
  request: ValidRequest,
  keyDB: Function,
  mandatorySignedHeaders: string[],
) => string;

export const authenticate: Authenticate = (config, request, keyDB, mandatorySignedHeaders) => {
  const currentDate = new Date();
  validateRequest(request);
  validateMandatorySignedHeaders(mandatorySignedHeaders);
  const uri = getUrlWithParsedQuery(request.url);
  return isPresignedUrl(config, uri, request)
    ? authenticatePresignedUrl(config, request, keyDB, mandatorySignedHeaders, currentDate)
    : authenticateHeaders(config, request, keyDB, mandatorySignedHeaders, currentDate);
};
