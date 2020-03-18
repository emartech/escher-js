import { ValidateRequest, EscherRequestHeader, SignRequest } from '../../interface';
import { GetAuthorizationHeader, GetDateHeader, GetDate, GetHeadersToSign, ValidateSignRequestConfg } from './lib';
import { head, toLower, pipe, any } from 'ramda';

export type SignRequestStrategy = {
  validateRequest: ValidateRequest;
  getAuthorizationHeader: GetAuthorizationHeader;
  getHeadersToSign: GetHeadersToSign;
  getDateHeader: GetDateHeader;
  getDate: GetDate;
  validateSignRequestConfg: ValidateSignRequestConfg;
};

export const createSignRequest = (strategy: SignRequestStrategy): SignRequest => (
  config,
  requestToSign,
  body,
  additionalHeadersToSign,
) => {
  const date = strategy.getDate();
  strategy.validateRequest(requestToSign, body);
  strategy.validateSignRequestConfg(config);
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

function addHeader(header: EscherRequestHeader): (headers: EscherRequestHeader[]) => EscherRequestHeader[] {
  return headers => {
    if (any(([headerName]) => toLower(headerName) === toLower(head(header) as string), headers)) {
      return headers;
    }
    return [...headers, header];
  };
}
