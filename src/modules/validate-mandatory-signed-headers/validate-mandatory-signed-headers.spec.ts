import { validateMandatorySignedHeaders } from './validate-mandatory-signed-headers';

describe('Validate Mandatory Signed Headers', () => {
  [
    {
      should: 'throw error when headers is given but not array',
      headers: {},
    },
    {
      should: 'throw error when there is not string header in the given list',
      headers: ['Date', 1],
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      expect(() => validateMandatorySignedHeaders(testCase.headers as any)).toThrow(
        new Error('The mandatorySignedHeaders parameter must be undefined or array of strings'),
      );
    });
  });

  it('should not throw error no headers passed', () => {
    validateMandatorySignedHeaders();
  });
});
