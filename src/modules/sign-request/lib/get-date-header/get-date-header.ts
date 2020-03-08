import { SignRequestConfg, EscherRequestHeader } from '../../../../interface';
import { convertToAwsLongDate, getNormalizedHeaderName } from '../../../../lib';
const formatDate = require('dateformat');

export type GetDateHeader = (config: SignRequestConfg, date: Date) => EscherRequestHeader;

export const getDateHeader: GetDateHeader = (config, date) => {
  const headerName = getNormalizedHeaderName(config.dateHeaderName);
  const headerValue = getHeaderValue(date, headerName);
  return [headerName, headerValue];
};

function getHeaderValue(date: Date, headerName: string): string {
  return headerName === 'date' ? formatDate(date, 'GMT:ddd, dd mmm yyyy HH:MM:ss Z', true) : convertToAwsLongDate(date);
}
