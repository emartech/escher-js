import { EscherConfig } from '../../../../interface';
import { has, is, isEmpty } from 'ramda';

export type ValidateEscherConfig = (config: EscherConfig) => void;

export const validateEscherConfig: ValidateEscherConfig = config => {
  if (!has('apiSecret', config) || !is(String, config.apiSecret) || isEmpty(config.apiSecret)) {
    throw new Error('Invalid Escher key');
  }
};
