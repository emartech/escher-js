import { AuthenticateConfig, SignatureConfig } from '../../../../interface';
import { ParsedUrlQuery } from 'querystring';
import { getQueryPart } from '../get-query-part';
import { getApiSecret } from '../get-api-secret';
import { getCredentialScope } from '../get-credential-scope';
import { getHashAlgorithm } from '../get-hash-algorithm';

export type GetSignatureConfigFromQuery = (
  config: AuthenticateConfig,
  query: ParsedUrlQuery,
  keyDB: Function,
) => SignatureConfig;

export const getSignatureConfigFromQuery: GetSignatureConfigFromQuery = (config, query, keyDB) => {
  const { algoPrefix } = config;
  const credentials = getQueryPart(config, query, 'Credentials');
  const apiSecret = getApiSecret(credentials, keyDB);
  const credentialScope = getCredentialScope(credentials);
  const hashAlgo = getHashAlgorithm(getQueryPart(config, query, 'Algorithm')) as any;
  return { algoPrefix, apiSecret, credentialScope, hashAlgo };
};
