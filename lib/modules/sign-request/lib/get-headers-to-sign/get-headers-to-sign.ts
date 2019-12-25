import { EscherConfig } from '../../../../interface';
import { toLower, defaultTo } from 'ramda';

export type GetHeadersToSign = (config: EscherConfig, additionalHeadersToSign?: string[]) => string[];

export const getHeadersToSign: GetHeadersToSign = (config, additionalHeadersToSign) => [
  'host',
  toLower(config.dateHeaderName),
  ...defaultTo([], additionalHeadersToSign),
];
