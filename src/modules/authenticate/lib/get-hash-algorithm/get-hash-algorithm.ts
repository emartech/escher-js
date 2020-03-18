import { split, last } from 'ramda';

export type GetHashAlgorithm = (algorithm: string) => string;

export const getHashAlgorithm: GetHashAlgorithm = algorithm => last(split('-', algorithm))!;
