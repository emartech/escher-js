import { pipe, map, forEach, includes } from 'ramda';
import { getNormalizedHeaderName } from '../../../../lib';

export type CheckMandatorySignHeaders = (signedHeaders: string[], mandatorySignedHeaders: string[]) => void;

export const checkMandatorySignHeaders: CheckMandatorySignHeaders = (signedHeaders, mandatorySignedHeaders) => {
  const normalizedSignedHeaders = map(getNormalizedHeaderName)(signedHeaders);
  pipe(
    map(getNormalizedHeaderName),
    forEach(validateMandatoryHeaderPresent(normalizedSignedHeaders)),
  )(mandatorySignedHeaders);
};

function validateMandatoryHeaderPresent(header: string[]): (mandatoryHeader: string) => void {
  return mandatoryHeader => {
    if (!includes(mandatoryHeader, header)) {
      throw new Error(`The ${mandatoryHeader} header is not signed`);
    }
  };
}
