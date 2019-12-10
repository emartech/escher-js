import { createEscherConfig } from '../../../factory';
import { getDateHeader } from './get-date-header';

describe('Get Date Header', () => {
  [
    {
      should: 'return with the date header name',
      dateHeaderName: 'date-header-name',
      expected: 'date-header-name',
    },
    {
      should: 'remove whitespaces from date header name left',
      dateHeaderName: '      date-header-name',
      expected: 'date-header-name',
    },
    {
      should: 'remove whitespaces from date header name right',
      dateHeaderName: 'date-header-name      ',
      expected: 'date-header-name',
    },
    {
      should: 'convert to lower case',
      dateHeaderName: 'Date-Header-Name',
      expected: 'date-header-name',
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const config = createEscherConfig({ dateHeaderName: testCase.dateHeaderName });

      const [headerName] = getDateHeader(config, new Date());

      expect(headerName).toEqual(testCase.expected);
    });
  });

  [
    {
      should: 'convert date to header date',
      dateHeaderName: 'date',
      date: new Date(0),
      expected: ['date', 'Thu, 01 Jan 1970 00:00:00 GMT'],
    },
    {
      should: 'convert date to long date',
      dateHeaderName: 'not-date',
      date: new Date(0),
      expected: ['not-date', '19700101T000000Z'],
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const config = createEscherConfig({ dateHeaderName: testCase.dateHeaderName });

      const result = getDateHeader(config, testCase.date);

      expect(result).toEqual(testCase.expected);
    });
  });
});
