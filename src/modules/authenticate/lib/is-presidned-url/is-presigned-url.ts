import { EscherConfig, ValidRequest } from '../../../../interface';
import { UrlWithParsedQuery } from 'url';
import { has } from 'ramda';
import { getKeyWithVendorPrefix } from '../get-key-with-vendor-prefix';

export type IsPresignedUrl = (config: EscherConfig, url: UrlWithParsedQuery, request: ValidRequest) => boolean;

export const isPresignedUrl: IsPresignedUrl = (config, url, request) =>
  has(getKeyWithVendorPrefix(config, 'Signature'), url.query) && request.method === 'GET';
