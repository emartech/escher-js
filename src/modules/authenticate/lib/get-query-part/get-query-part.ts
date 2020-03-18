import { AuthenticateConfig } from '../../../../interface';
import { ParsedUrlQuery } from 'querystring';
import { propOr } from 'ramda';

export const getQueryPart = (config: AuthenticateConfig, query: ParsedUrlQuery, key: string): any =>
  propOr('', `X-${config.vendorKey}-${key}`, query);
