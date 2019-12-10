import { RequestHeader, EscherConfig, ValidRequest, RequestBody } from '../../../interface';
import { toLower } from 'ramda';
const AuthHelper = require('../../../authhelper');

export type GetAuthorizationHeader = (
  config: EscherConfig,
  date: Date,
  request: ValidRequest,
  body: RequestBody,
  headersToSign: string[],
) => RequestHeader;

export const getAuthorizationHeader: GetAuthorizationHeader = (config, date, request, body, headersToSign) => {
  const headerName = toLower(config.authHeaderName);
  const headerValue = new AuthHelper(config, date).generateHeader(request, body, headersToSign);
  return [headerName, headerValue];
};
