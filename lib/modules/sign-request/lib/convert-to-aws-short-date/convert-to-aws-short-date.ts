const formatDate = require('dateformat');

export type ConvertToAwsShortDate = (date: Date) => string;

export const convertToAwsShortDate: ConvertToAwsShortDate = date => formatDate(date, `GMT:yyyymmdd`, true);
