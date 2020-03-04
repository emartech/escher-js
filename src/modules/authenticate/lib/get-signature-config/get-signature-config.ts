import { AuthenticateConfig, SignatureConfig } from '../../../../interface';
import { ParsedUrlQuery } from 'querystring';
import { getQueryPart } from '../get-query-part';
import { getAccessKeyId } from '../get-access-key-id';
import { split, join, last } from 'ramda';

export type GetSignatureConfig = (
  config: AuthenticateConfig,
  query: ParsedUrlQuery,
  keyDB: Function,
) => SignatureConfig;

export const getSignatureConfig: GetSignatureConfig = (config, query, keyDB) => {
  const { algoPrefix } = config;
  const credentials = getQueryPart(config, query, 'Credentials');
  const apiSecret = getApiSecret(credentials, keyDB);
  const credentialScope = getCredentialScope(credentials);
  const hashAlgo = getHashAlgorithm(getQueryPart(config, query, 'Algorithm')) as any;
  return { algoPrefix, apiSecret, credentialScope, hashAlgo };
};

function getApiSecret(credentials: string, keyDB: Function): string {
  const accessKeyId = getAccessKeyId(credentials);
  return keyDB(accessKeyId);
}

function getCredentialScope(credentials: string): string {
  const [, , ...credentialScopeParts] = split('/', credentials);
  return join('/', credentialScopeParts);
}

function getHashAlgorithm(algorithm: string): string {
  return last(split('-', algorithm))!;
}
