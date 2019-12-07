import { checkPartialEscherConfig } from './check-partial-escher-config';
import { v4 } from 'uuid';
import { toUpper } from 'ramda';

describe('Check Partial Escher Config', () => {
  [
    {
      should: 'throw error when hashAlgo is not SHA256 or SHA512',
      partialEscherConfig: { hashAlgo: 'otherHashAlgo' },
      expectedError: new Error('Only SHA256 and SHA512 hash algorithms are allowed')
    },
    {
      should: 'throw error when algoPrefix is not string',
      partialEscherConfig: { algoPrefix: 1 },
      expectedError: new Error('Algorithm prefix should be a string')
    },
    {
      should: 'throw error when vendorKey is not string',
      partialEscherConfig: { vendorKey: 1 },
      expectedError: new Error('Vendor key should be an uppercase string')
    },
    {
      should: 'throw error when vendorKey is uppercase',
      partialEscherConfig: { vendorKey: 'vendorkey' },
      expectedError: new Error('Vendor key should be an uppercase string')
    }
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      expect(() => checkPartialEscherConfig(testCase.partialEscherConfig)).toThrow(testCase.expectedError);
    });
  });

  [
    {
      should: 'not throw error when algoPrefix is string',
      partialEscherConfig: { algoPrefix: v4() }
    },
    {
      should: 'not throw error when vendorKey is string',
      partialEscherConfig: { vendorKey: toUpper(v4()) }
    },
    {
      should: 'not throw error when hashAlgo SHA256',
      partialEscherConfig: { hashAlgo: 'SHA256' }
    },
    {
      should: 'not throw error when hashAlgo SHA512',
      partialEscherConfig: { hashAlgo: 'SHA512' }
    }
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      checkPartialEscherConfig(testCase.partialEscherConfig);
    });
  });

  it('should not throw error no config passed', () => {
    checkPartialEscherConfig();
  });
});
