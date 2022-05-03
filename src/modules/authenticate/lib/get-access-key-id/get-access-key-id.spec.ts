import { getAccessKeyId } from './get-access-key-id';

describe('Get Access Key Id', () => {
  [
    {
      should: 'return access key id from credentials',
      input: 'AKIDEXAMPLE/19000210/escher_request',
      expected: 'AKIDEXAMPLE',
    },
    {
      should: 'return empty string when no access key id',
      input: '',
      expected: '',
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const result = getAccessKeyId(testCase.input);
      expect(result).toEqual(testCase.expected);
    });
  });
});
