import { EscherRequest, EscherRequestHeaderValue, EscherRequestHeader } from '../../../../interface';
import { isNil, last, find } from 'ramda';
import { getNormalizedHeaderName } from '../../../../lib';

export type GetHeaderValue = (request: EscherRequest, soughtHeaderName: string) => EscherRequestHeaderValue;

export const getHeaderValue: GetHeaderValue = (request, soughtHeaderName) => {
  const value = find<EscherRequestHeader>(
    ([name]) => getNormalizedHeaderName(name) === getNormalizedHeaderName(soughtHeaderName),
    request.headers,
  );
  if (isNil(value)) {
    throw new Error(`The ${soughtHeaderName} header is missing`);
  }
  return last(value) as EscherRequestHeaderValue;
};
