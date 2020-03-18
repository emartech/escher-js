import { isEqualFixedTime } from '../is-equal-fixed-time';
import { is } from 'ramda';
import { AuthenticateConfig, SignatureConfig } from '../../../../interface';

export type CheckSignatureConfig = (config: AuthenticateConfig, signatureConfig: SignatureConfig) => void;

export const checkSignatureConfig: CheckSignatureConfig = (config, signatureConfig) => {
  if (!is(String, signatureConfig.apiSecret)) {
    throw new Error('Invalid Escher key');
  }
  if (!isEqualFixedTime(signatureConfig.credentialScope, config.credentialScope)) {
    throw new Error('Invalid Credential Scope');
  }
  if (!['SHA256', 'SHA512'].includes(signatureConfig.hashAlgo)) {
    throw new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed');
  }
};
