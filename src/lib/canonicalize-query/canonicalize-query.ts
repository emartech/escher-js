import { ParsedUrlQuery } from 'querystring';
import { pipe, replace, toPairs, join, map, comparator, lt, sort, is, reduce } from 'ramda';

export const canonicalizeQuery = (query: ParsedUrlQuery): string => {
  return pipe(
    (_: ParsedUrlQuery) => toPairs<string | string[]>(_),
    reduce((pairs: [string, string][], pair: [string, string | string[]]) => [...pairs, ...flattenPair(pair)], []),
    map(canonicalizePair),
    sort(comparator(lt)) as any,
    join('&'),
  )(query);
};

function flattenPair([key, value]: [string, string | string[]]): [string, string][] {
  return is(Array, value) ? map(_ => [key, _], value as any) : [[key, value]];
}

function canonicalizePair([key, value]: [string, string]): string {
  return `${getEncodedComponent(key)}=${getEncodedComponent(value)}`;
}

function getEncodedComponent(input: string): string {
  return pipe(
    encodeURIComponent,
    replace(/'/g, '%27'),
    replace(/\(/g, '%28'),
    replace(/\)/g, '%29'),
  )(input);
}
