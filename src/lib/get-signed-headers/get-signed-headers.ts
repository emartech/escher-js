import { pipe, map, comparator, sort, uniq, join, lt } from 'ramda';
import { getNormalizedHeaderName } from '../get-normalized-header-name';

export type GetSignedHeaders = (headersToSign: string[]) => string;

export const getSignedHeaders: GetSignedHeaders = headersToSign =>
  pipe(
    map<string, string>(getNormalizedHeaderName),
    uniq as any,
    sort(comparator(lt)),
    join(';'),
  )(headersToSign);
