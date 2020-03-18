import { UrlWithParsedQuery, parse } from 'url';
import { replace, pipe } from 'ramda';

export type GetUrlWithParsedQuery = (url: string) => UrlWithParsedQuery;

export const getUrlWithParsedQuery: GetUrlWithParsedQuery = url => {
  // https://github.com/joyent/node/blob/4b59db008cec1bfcca2783f4b27c630c9c3fdd73/lib/url.js#L113-L117
  const fixedUrl = pipe(
    replace('#', '%23'),
    replace('\\', '%5C'),
  )(url);
  const parseQueryString = true;
  return parse(fixedUrl, parseQueryString);
};
