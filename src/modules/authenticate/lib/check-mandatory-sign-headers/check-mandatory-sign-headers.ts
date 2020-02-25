import { pipe, append, map, forEach, includes } from 'ramda';
import { getNormalizedHeaderName } from '../../../../lib';

export type CheckMandatorySignHeaders = (signedHeaders: string[], mandatorySignedHeaders: string[]) => void;

export const checkMandatorySignHeaders: CheckMandatorySignHeaders = (signedHeaders, mandatorySignedHeaders) => {
  const normalizedSignedHeaders = map(getNormalizedHeaderName)(signedHeaders);

  pipe(
    (headers: string[]) => append('host', headers),
    map(getNormalizedHeaderName),
    forEach(validateMandatoryHeaderPresent(normalizedSignedHeaders)),
  )(mandatorySignedHeaders);
};


const validateMandatoryHeaderPresent = (header: string[]) => (mandatoryHeader: string) => {
  if (!includes(mandatoryHeader, header)) {
    throw new Error(`The ${mandatoryHeader} header is not signed`);
  }
};
