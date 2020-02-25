import { pipe, append, map, forEach, includes } from 'ramda';
import { getNormalizedHeaderName } from '../../../../lib';

export type CheckMandatorySignHeaders = (signedHeaders: string[], mandatorySignedHeaders: string[]) => void;

export const checkMandatorySignHeaders: CheckMandatorySignHeaders = (signedHeaders, mandatorySignedHeaders) => {
  pipe(
    (headers: string[]) => append('host', headers),
    map(getNormalizedHeaderName),
    forEach(mandatoryHeader => {
      if (!includes(mandatoryHeader, signedHeaders)) {
        throw new Error(`The ${mandatoryHeader} header is not signed`);
      }
    }),
  )(mandatorySignedHeaders);
};
