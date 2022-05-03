import { test, match } from 'ramda';

export function parseLongDate(longDate: string): Date {
  chechLongDate(longDate);
  return getDate(longDate);
}

function chechLongDate(longDate: string): void {
  if (!test(/^\d{8}T\d{6}Z$/, longDate)) {
    throw new Error('Invalid date header, expected format is: 20151104T092022Z');
  }
}

function getDate(longDate: string): Date {
  const [, year, month, day, hour, minute, second] = match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, longDate);
  return new Date(`${year} ${month} ${day} ${hour}:${minute}:${second} GMT`);
}
