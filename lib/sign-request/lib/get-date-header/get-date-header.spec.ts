import { createEscherConfig } from '../../../factory';
import { getDateHeader } from './get-date-header';

describe('Get Date Header', () => {
  it(`should return normalized header name`, () => {
    const dateHeaderName = '    Date-Header-Name     ';
    const config = createEscherConfig({ dateHeaderName });

    const [headerName] = getDateHeader(config, new Date());

    expect(headerName).toEqual('date-header-name');
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
