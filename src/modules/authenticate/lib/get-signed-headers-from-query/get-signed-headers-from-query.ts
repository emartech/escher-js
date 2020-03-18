import { AuthenticateConfig } from '../../../../interface';
import { ParsedUrlQuery } from 'querystring';
import { getQueryPart } from '../get-query-part';
import { split } from 'ramda';

export type GetSignedHeadersFromQuery = (config: AuthenticateConfig, query: ParsedUrlQuery) => string[];

export const getSignedHeadersFromQuery: GetSignedHeadersFromQuery = (config, query) =>
  split(';', getQueryPart(config, query, 'SignedHeaders'));
