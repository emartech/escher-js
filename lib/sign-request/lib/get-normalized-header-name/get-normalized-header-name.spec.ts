import { getNormalizedHeaderName } from './get-normalized-header-name';

describe('Get Normalized Header Name', () => {
  [
    {
      should: 'return with the header name',
      headerName: 'date-header-name',
      expected: 'date-header-name',
    },
    {
      should: 'remove whitespaces from header name left',
      headerName: '      date-header-name',
      expected: 'date-header-name',
    },
    {
      should: 'remove whitespaces from header name right',
      headerName: 'date-header-name      ',
      expected: 'date-header-name',
    },
    {
      should: 'convert to lower case',
      headerName: 'Date-Header-Name',
      expected: 'date-header-name',
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const normalizedHeaderName = getNormalizedHeaderName(testCase.headerName);

      expect(normalizedHeaderName).toEqual(testCase.expected);
    });
  });
});
