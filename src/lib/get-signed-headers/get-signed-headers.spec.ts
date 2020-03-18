import { getSignedHeaders } from './get-signed-headers';

describe('Get Signed Headers', () => {
  [
    {
      should: 'return a header',
      headersToSign: ['test'],
      expected: 'test',
    },
    {
      should: 'join headers with ;',
      headersToSign: ['alpha', 'beta'],
      expected: 'alpha;beta',
    },
    {
      should: 'sort headers',
      headersToSign: ['beta', 'alpha', 'gamma'],
      expected: 'alpha;beta;gamma',
    },
    {
      should: 'normalize haeder',
      headersToSign: ['BeTa'],
      expected: 'beta',
    },
    {
      should: 'remove duplications',
      headersToSign: ['alpha', 'alpha'],
      expected: 'alpha',
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const result = getSignedHeaders(testCase.headersToSign);
      expect(result).toEqual(testCase.expected);
    });
  });
});
