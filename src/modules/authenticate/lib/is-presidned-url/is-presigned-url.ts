import { ValidRequest, AuthenticateConfig } from '../../../../interface';
import { UrlWithParsedQuery } from 'url';
import { isEmpty } from 'ramda';
import { getQueryPart } from '../get-query-part';

export type IsPresignedUrl = (config: AuthenticateConfig, url: UrlWithParsedQuery, request: ValidRequest) => boolean;

export const isPresignedUrl: IsPresignedUrl = (config, url, request) =>
  !isEmpty(getQueryPart(config, url.query, 'Signature')) && request.method === 'GET';
