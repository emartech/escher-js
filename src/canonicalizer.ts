import { posix } from 'path';
import { Utils } from './utils';

export class Canonicalizer {
  private readonly _hashAlgo: string;

  constructor(hashAlgo: string) {
    this._hashAlgo = hashAlgo;
  }

  _canonicalizeHeaders(headers: Record<string, string>) {
    return Object.keys(headers).map((key) => key + ':' + headers[key]);
  }

  canonicalizeQuery(query: Record<string, string | string[]>) {
    const encodeComponent = (component: string) =>
      encodeURIComponent(component).replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29');

    const join = (key: string, value: string) => encodeComponent(key) + '=' + encodeComponent(value);

    return Object.keys(query)
      .map((key) => {
        const value = query[key];
        if (typeof value === 'string') {
          return join(key, value);
        }
        return value
          .sort()
          .map((oneValue) => join(key, oneValue))
          .join('&');
      })
      .sort()
      .join('&');
  }

  _filterHeaders(headers: Record<string, string>, headersToSign: string[]) {
    const filteredHeaders: Record<string, string> = {};
    const normalizedSignedHeaders = headersToSign.map((header) => header.toLowerCase());

    Object.keys(headers).forEach((headerName) => {
      if (normalizedSignedHeaders.includes(headerName)) {
        filteredHeaders[headerName] = headers[headerName];
      }
    });

    return filteredHeaders;
  }

  canonicalizeRequest(requestOptions: any, body: any, headersToSign: string[]) {
    // https://github.com/joyent/node/blob/4b59db008cec1bfcca2783f4b27c630c9c3fdd73/lib/url.js#L113-L117
    const preparedUrl = requestOptions.url.replace('#', '%23').replace('\\', '%5C');
    const parsedUrl = Utils.parseUrl(preparedUrl, true);
    const headers = this._filterHeaders(Utils.normalizeHeaders(requestOptions.headers), headersToSign);
    const lines = [
      requestOptions.method,
      posix.normalize(parsedUrl.pathname || ''),
      this.canonicalizeQuery(parsedUrl.query as Record<string, string | string[]>),
      this._canonicalizeHeaders(headers).join('\n'),
      '',
      Object.keys(headers).join(';'),
      Utils.hash(this._hashAlgo, body)
    ];
    return lines.join('\n');
  }

  getCanonicalizedSignedHeaders(headers: Record<string, string> | string[][], headersToSign: string[]) {
    const normalizedHeaders = this._filterHeaders(Utils.normalizeHeaders(headers), headersToSign);
    return Object.keys(normalizedHeaders);
  }
}
