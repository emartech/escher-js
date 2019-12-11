import { ValidRequest, EscherConfig, RequestBody, ValidateRequest, RequestHeader } from '../interface';
import { GetAuthorizationHeader, GetDateHeader, GetDate, GetHeadersToSign } from './lib';
import { head, toLower, pipe, any } from 'ramda';

export type SignRequestStrategy = {
  validateRequest: ValidateRequest;
  getAuthorizationHeader: GetAuthorizationHeader;
  getHeadersToSign: GetHeadersToSign;
  getDateHeader: GetDateHeader;
  getDate: GetDate;
};

export type SignRequest = (
  config: EscherConfig,
  requestToSign: ValidRequest,
  body: RequestBody,
  additionalHeadersToSign: string[],
) => ValidRequest;

export const createSignRequest = (strategy: SignRequestStrategy): SignRequest => (
  config,
  requestToSign,
  body,
  additionalHeadersToSign,
) => {
  const date = strategy.getDate();
  strategy.validateRequest(requestToSign, body);
  const dateHeader = strategy.getDateHeader(config, date);
  const authorizationHeader = strategy.getAuthorizationHeader(
    config,
    date,
    {
      ...requestToSign,
      headers: addHeader(dateHeader)(requestToSign.headers),
    },
    body,
    strategy.getHeadersToSign(config, additionalHeadersToSign),
  );
  return {
    ...requestToSign,
    headers: pipe(
      addHeader(dateHeader),
      addHeader(authorizationHeader),
    )(requestToSign.headers),
  };
};

function addHeader(header: RequestHeader): (headers: RequestHeader[]) => RequestHeader[] {
  return headers => {
    if (any(([headerName]) => toLower(headerName) === toLower(head(header) as string), headers)) {
      return headers;
    }
    return [...headers, header];
  };
}
