import { getCredentialScope } from './get-credential-scope';

describe('Get Credential Scope', () => {
  [
    {
      should: 'return third part of the credentials',
      credentials: 'first/second/[X]',
      expected: '[X]',
    },
    {
      should: 'return third part of the credentials when third part contains slash',
      credentials: 'first/second/example/credential/scope',
      expected: 'example/credential/scope',
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const result = getCredentialScope(testCase.credentials);
      expect(result).toEqual(testCase.expected);
    });
  });
});
