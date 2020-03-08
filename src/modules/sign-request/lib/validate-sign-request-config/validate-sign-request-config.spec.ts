import { validateSignRequestConfg } from './validate-sign-request-config';
import { v4 } from 'uuid';

describe('Validate Escher Config', () => {
  [
    {
      should: 'throw error when no apiSecret',
      escherConfig: {},
      expectedError: new Error('Invalid Escher key'),
    },
    {
      should: 'throw error when apiSecret is not string',
      escherConfig: { apiSecret: 1 },
      expectedError: new Error('Invalid Escher key'),
    },
    {
      should: 'throw error when apiSecret is empty string',
      escherConfig: { apiSecret: '' },
      expectedError: new Error('Invalid Escher key'),
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      expect(() => validateSignRequestConfg(testCase.escherConfig as any)).toThrow(testCase.expectedError);
    });
  });

  [
    {
      should: 'not throw error when apiSecret is string and not empty',
      escherConfig: { apiSecret: v4() },
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      validateSignRequestConfg(testCase.escherConfig as any);
    });
  });
});
