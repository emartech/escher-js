import { createSignRequest } from './sign-request';
import { getDate, getAuthorizationHeader, getDateHeader, getHeadersToSign, validateEscherConfig } from './lib';
import { validateRequest } from '../validate-request';
export const signRequest = createSignRequest({
  validateRequest,
  getAuthorizationHeader,
  getDateHeader,
  getDate,
  getHeadersToSign,
  validateEscherConfig,
});
