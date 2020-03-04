import { ParsedUrlQuery } from 'querystring';
import { getQueryPart } from '../get-query-part';
import { convertToAwsShortDate } from '../../../../lib';
import { parseLongDate } from '../parse-long-date';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { split } from 'ramda';

export function checkRequestDate(config: any, query: ParsedUrlQuery, currentDate: Date): void {
  const credentials = getQueryPart(config, query, 'Credentials');
  const shortDate = getShortDate(credentials);
  // console.error({ date: getQueryPart(config, query, 'Date'), credentials });
  const requestDate = parseLongDate(getQueryPart(config, query, 'Date'));
  if (!isEqualFixedTime(shortDate!, convertToAwsShortDate(requestDate))) {
    throw new Error('Invalid date in authorization header, it should equal with date header');
  }

  const requestTime = requestDate.getTime();
  const currentTime = currentDate.getTime();
  const expires = parseInt(getQueryPart(config, query, 'Expires'));
  if (!isDateWithinRange(config, requestTime, currentTime, expires)) {
    throw new Error('The request date is not within the accepted time range');
  }
}

function getShortDate(credentials: string): string | undefined {
  const [, shortDate] = split('/', credentials);
  return shortDate;
}

function isDateWithinRange(config: any, requestTime: any, currentTime: any, expires: any): any {
  return (
    requestTime - config.clockSkew * 1000 <= currentTime &&
    currentTime < requestTime + expires * 1000 + config.clockSkew * 1000
  );
}
