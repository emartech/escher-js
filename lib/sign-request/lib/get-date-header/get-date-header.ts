import { EscherConfig, RequestHeaders } from '../../../interface';
import { pipe, trim, toLower } from 'ramda';
const formatDate = require('dateformat');

export type GetDateHeader = (config: EscherConfig, date: Date) => RequestHeaders;

export const getDateHeader: GetDateHeader = (config, date) => {
  const headerName = getHeaderName(config);
  const headerValue = getHeaderValue(date, headerName);
  return { [headerName]: headerValue };
};

function getHeaderName(config: EscherConfig): string {
  return pipe(
    trim,
    toLower,
  )(config.dateHeaderName);
}

function getHeaderValue(date: Date, headerName: string): string {
  const pattern = headerName === 'date' ? 'GMT:ddd, dd mmm yyyy HH:MM:ss Z' : `GMT:yyyymmdd'T'HHMMss'Z'`;
  return formatDate(date, pattern, true);
}
