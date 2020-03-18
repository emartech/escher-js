const formatDate = require('dateformat');

export type ConvertToAwsLongDate = (date: Date) => string;

export const convertToAwsLongDate: ConvertToAwsLongDate = date => formatDate(date, `GMT:yyyymmdd'T'HHMMss'Z'`, true);
