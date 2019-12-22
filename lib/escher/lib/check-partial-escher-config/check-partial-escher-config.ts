import { is, toUpper, has, includes, isNil, isEmpty } from 'ramda';

export type CheckPartialEscherConfig = (partialEscherConfig?: any) => void;

export const checkPartialEscherConfig: CheckPartialEscherConfig = config => {
  if (isNil(config)) {
    return;
  }
  if (has('vendorKey', config) && (!isString(config.vendorKey) || !isUpperCase(config.vendorKey))) {
    throw new Error('Vendor key should be an uppercase string');
  }
  if (has('algoPrefix', config) && !isString(config.algoPrefix)) {
    throw new Error('Algorithm prefix should be a string');
  }
  if (has('hashAlgo', config) && !includes(config.hashAlgo, ['SHA256', 'SHA512'])) {
    throw new Error('Only SHA256 and SHA512 hash algorithms are allowed');
  }
  if (!has('apiSecret', config) || !isString(config.apiSecret) || isEmpty(config.apiSecret)) {
    throw new Error('Invalid Escher key');
  }
};

function isString(input: any): boolean {
  return is(String, input);
}

function isUpperCase(input: string): boolean {
  return toUpper(input) === input;
}
