import { createSignRequest } from './sign-request';
import { getDate, getAuthorizationHeader, getDateHeader, getHeadersToSign, validateSignRequestConfg } from './lib';
import { validateRequest } from '../validate-request';
export const signRequest = createSignRequest({
  validateRequest,
  getAuthorizationHeader,
  getDateHeader,
  getDate,
  getHeadersToSign,
  validateSignRequestConfg: validateSignRequestConfg,
});
