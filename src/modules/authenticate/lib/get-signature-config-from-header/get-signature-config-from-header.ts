import { AuthenticateConfig, SignatureConfig } from '../../../../interface';
import { split, last, init, forEach, isNil, isEmpty, values, is, head } from 'ramda';
import { getApiSecret } from '../get-api-secret';
import { getCredentialScope } from '../get-credential-scope';
import { getHashAlgorithm } from '../get-hash-algorithm';

export type GetSignatureConfigFromHeader = (
  config: AuthenticateConfig,
  header: string,
  keyDB: Function,
) => SignatureConfig;

export const getSignatureConfigFromHeader: GetSignatureConfigFromHeader = (config, header, keyDB) => {
  const credentials = getCredentials(header);
  const hashAlgo = getHashAlgorithm(getAlorithm(header)) as any;
  const { algoPrefix } = config;
  const apiSecret = getApiSecret(credentials, keyDB);
  const credentialScope = getCredentialScope(credentials);
  const signatureConfig = { algoPrefix, apiSecret, credentialScope, hashAlgo };
  checkApiSecret(apiSecret);
  checkHeaderFormat(signatureConfig);
  return signatureConfig;
};

function getCredentials(header: string): string {
  const [, credentialsPair] = split(' ', header);
  return init(last(split('=', credentialsPair))!);
}

function getAlorithm(header: string): string {
  return head(split(' ', header))!;
}

function checkApiSecret(apiSecret: any): void {
  if (!is(String, apiSecret)) {
    throw new Error('Invalid Escher key');
  }
}

function checkHeaderFormat(signatureConfig: SignatureConfig): void {
  forEach(value => {
    if (isNil(value) || isEmpty(value)) {
      throw new Error('Invalid auth header format');
    }
  }, values(signatureConfig));
}
