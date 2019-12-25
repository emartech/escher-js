import { EscherConfig, RequestHeader } from '../../../../interface';
import { convertToAwsLongDate } from '../convert-to-aws-long-date';
import { getNormalizedHeaderName } from '../get-normalized-header-name';
const formatDate = require('dateformat');

export type GetDateHeader = (config: EscherConfig, date: Date) => RequestHeader;

export const getDateHeader: GetDateHeader = (config, date) => {
  const headerName = getNormalizedHeaderName(config.dateHeaderName);
  const headerValue = getHeaderValue(date, headerName);
  return [headerName, headerValue];
};

function getHeaderValue(date: Date, headerName: string): string {
  return headerName === 'date' ? formatDate(date, 'GMT:ddd, dd mmm yyyy HH:MM:ss Z', true) : convertToAwsLongDate(date);
}
