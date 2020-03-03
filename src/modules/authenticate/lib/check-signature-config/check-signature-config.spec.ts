import { createSignatureConfig } from '../../../../factory';
import { checkSignatureConfig } from './check-signature-config';
import { v4 } from 'uuid';

describe('Check Signature Config', () => {
  it('should throw error when apiSecret is not string', () => {
    const apiSecret: any = 1;
    const config = createSignatureConfig({ apiSecret });
    expect(() => checkSignatureConfig({}, config)).toThrow(new Error('Invalid Escher key'));
  });

  it('should not throw error when apiSecret is string', () => {
    const apiSecret = v4();
    const credentialScope = v4();
    const config = createSignatureConfig({ apiSecret, credentialScope });
    expect(() => checkSignatureConfig({ credentialScope }, config)).not.toThrow();
  });

  it('should throw error when credentialScopes are not the same', () => {
    const signatureConfigCredentialScope = 'signatureConfigCredentialScope';
    const authenticateConfigCredentialScope = 'authenticateConfigCredentialScope';
    const config = createSignatureConfig({ credentialScope: signatureConfigCredentialScope });
    const authenticateConfig = { credentialScope: authenticateConfigCredentialScope };
    expect(() => checkSignatureConfig(authenticateConfig, config)).toThrow(new Error('Invalid Credential Scope'));
  });

  it('should not throw error when credentialScopes are the same', () => {
    const signatureConfigCredentialScope = 'credentialScope';
    const authenticateConfigCredentialScope = 'credentialScope';
    const config = createSignatureConfig({ credentialScope: signatureConfigCredentialScope });
    const authenticateConfig = { credentialScope: authenticateConfigCredentialScope };
    expect(() => checkSignatureConfig(authenticateConfig, config)).not.toThrow();
  });

  it('should throw error when hashAlgo is invalid', () => {
    const hashAlgo: any = v4();
    const credentialScope = v4();
    const config = createSignatureConfig({ hashAlgo, credentialScope });
    expect(() => checkSignatureConfig({ credentialScope }, config)).toThrow(
      new Error('Invalid hash algorithm, only SHA256 and SHA512 are allowed'),
    );
  });

  it('should not throw error when hashAlgo is SHA256', () => {
    const hashAlgo = 'SHA256';
    const credentialScope = v4();
    const config = createSignatureConfig({ hashAlgo, credentialScope });
    expect(() => checkSignatureConfig({ credentialScope }, config)).not.toThrow();
  });

  it('should not throw error when hashAlgo is SHA512', () => {
    const hashAlgo = 'SHA512';
    const credentialScope = v4();
    const config = createSignatureConfig({ hashAlgo, credentialScope });
    expect(() => checkSignatureConfig({ credentialScope }, config)).not.toThrow();
  });
});
