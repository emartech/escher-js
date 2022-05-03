import { SignRequestConfg } from '../../../../interface';
import { has, is, isEmpty } from 'ramda';

export type ValidateSignRequestConfg = (config: SignRequestConfg) => void;

export const validateSignRequestConfg: ValidateSignRequestConfg = config => {
  if (!has('apiSecret', config) || !is(String, config.apiSecret) || isEmpty(config.apiSecret)) {
    throw new Error('Invalid Escher key');
  }
};
