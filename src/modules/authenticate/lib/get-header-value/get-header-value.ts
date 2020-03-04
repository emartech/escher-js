import { ValidRequest, RequestHeaderValue, RequestHeader } from '../../../../interface';
import { find, isNil, last } from 'ramda';
import { getNormalizedHeaderName } from '../../../../lib';

export type GetHeaderValue = (request: ValidRequest, soughtHeaderName: string) => RequestHeaderValue;

export const getHeaderValue: GetHeaderValue = (request, soughtHeaderName) => {
  const value = find<RequestHeader>(
    ([name]) => getNormalizedHeaderName(name) === getNormalizedHeaderName(soughtHeaderName),
    request.headers,
  );
  if (isNil(value)) {
    throw new Error(`The ${soughtHeaderName} header is missing`);
  }
  return last(value) as RequestHeaderValue;
};
