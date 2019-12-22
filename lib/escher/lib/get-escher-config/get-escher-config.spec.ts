import { EscherConfig } from '../../../interface';
import { getEscherConfig } from './get-escher-config';

describe('Get Escher Config', () => {
  [
    {
      should: 'return default config when no parameter passed',
      partialOptions: undefined,
      expected: getDefaultConfig(),
    },
    {
      should: 'return default config when empty object passed',
      partialOptions: {},
      expected: getDefaultConfig(),
    },
    {
      should: 'return default config merged with given partial config',
      partialOptions: {
        algoPrefix: '[algo prefix]',
        vendorKey: '[vendor key]',
        clockSkew: 500,
      },
      expected: {
        ...getDefaultConfig(),
        algoPrefix: '[algo prefix]',
        vendorKey: '[vendor key]',
        clockSkew: 500,
      },
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const result = getEscherConfig(testCase.partialOptions);
      expect(result).toEqual(testCase.expected);
    });
  });
});

function getDefaultConfig(): EscherConfig {
  return {
    algoPrefix: 'ESR',
    vendorKey: 'ESCHER',
    hashAlgo: 'SHA256',
    credentialScope: 'escher_request',
    authHeaderName: 'X-Escher-Auth',
    dateHeaderName: 'X-Escher-Date',
    clockSkew: 300,
    accessKeyId: '',
  };
}
