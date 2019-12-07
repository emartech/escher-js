import { ValidateMandatorySignedHeaders } from '../interface';
import { is, all } from 'ramda';

export const validateMandatorySignedHeaders: ValidateMandatorySignedHeaders = headers => {
  if (headers === undefined) {
    return;
  }
  if (!is(Array, headers) || !isAllString(headers)) {
    throw new Error('The mandatorySignedHeaders parameter must be undefined or array of strings');
  }
};

function isAllString(items: any[]): boolean {
  return all(is(String), items);
}
