import { SignRequestConfg } from '../../../../interface';
import { toLower, defaultTo } from 'ramda';

export type GetHeadersToSign = (config: SignRequestConfg, additionalHeadersToSign?: string[]) => string[];

export const getHeadersToSign: GetHeadersToSign = (config, additionalHeadersToSign) => [
  'host',
  toLower(config.dateHeaderName),
  ...defaultTo([], additionalHeadersToSign),
];
