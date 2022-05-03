import { convertToAwsShortDate } from '../../../../lib';
import { parseLongDate } from '../parse-long-date';
import { isEqualFixedTime } from '../is-equal-fixed-time';
import { split } from 'ramda';
import { AuthenticateConfig } from '../../../../interface';

export type CheckRequestDate = (
  config: AuthenticateConfig,
  credentials: string,
  requestLongDate: string,
  expires: number,
  currentDate: Date,
) => void;

export const checkRequestDate: CheckRequestDate = (config, credentials, requestLongDate, expires, currentDate) => {
  const credentialShortDate = getShortDate(credentials);
  const requestDate = parseLongDate(requestLongDate);
  if (!isEqualFixedTime(credentialShortDate!, convertToAwsShortDate(requestDate))) {
    throw new Error('Invalid date in authorization header, it should equal with date header');
  }

  const requestTime = requestDate.getTime();
  const currentTime = currentDate.getTime();
  if (!isDateWithinRange(config, requestTime, currentTime, expires)) {
    throw new Error('The request date is not within the accepted time range');
  }
};

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
