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

// function checkExpiration(config: EscherConfig, requestDate: Date, date: Date, expires: number): void {
//   const requestTime = requestDate.getTime();
//   const currentTime = date.getTime();
//   const isNotExpired =
//     requestTime - config.clockSkew * 1000 <= currentTime &&
//     currentTime < requestTime + expires * 1000 + config.clockSkew * 1000;
//   if (!isNotExpired) {
//     throw new Error('The request date is not within the accepted time range');
//   }
// }
