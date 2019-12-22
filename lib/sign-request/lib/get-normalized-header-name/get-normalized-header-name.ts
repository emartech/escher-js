import { trim, toLower, pipe } from 'ramda';

export type GetNormalizedHeaderName = (headerName: string) => string;

export const getNormalizedHeaderName: GetNormalizedHeaderName = headerName =>
  pipe(
    trim,
    toLower,
  )(headerName);
