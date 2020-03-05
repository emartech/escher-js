import { v4 } from 'uuid';
import { createAuthenticateConfig } from '../../../../factory';
import { getSignatureConfigFromHeader } from './get-signature-config-from-header';
import { AuthenticateConfig } from '../../../../interface';

describe('Get Signature Config From Header', () => {
  it('should returns algo prefix from passwd authetenticate config', () => {
    const algoPrefix = v4();
    const config = createAuthenticateConfig({ algoPrefix });
    const result = getSignatureConfigFromHeader(
      config,
      createHeader({ algorithm: createAlgorithmHeader(config, 'SHA256') }),
      () => v4(),
    );
    expect(result.algoPrefix).toEqual(algoPrefix);
  });

  it('should calls keyDB with access key id', () => {
    const accessKeyId = v4();
    const config = createAuthenticateConfig();
    const keyDB = jasmine.createSpy('keyDB').and.returnValue(v4());
    getSignatureConfigFromHeader(
      config,
      createHeader({
        algorithm: createAlgorithmHeader(config, 'SHA256'),
        credentials: `${accessKeyId}/11111111/${v4()}`,
      }),
      keyDB,
    );
    expect(keyDB).toHaveBeenCalledWith(accessKeyId);
  });

  it('should returns api secret from keyDB', () => {
    const apiSecret = v4();
    const keyDB = () => apiSecret;
    const config = createAuthenticateConfig();
    const result = getSignatureConfigFromHeader(
      config,
      createHeader({ algorithm: createAlgorithmHeader(config, 'SHA256') }),
      keyDB,
    );
    expect(result.apiSecret).toEqual(apiSecret);
  });

  it('should returns credential scope', () => {
    const credentialScope = v4();
    const config = createAuthenticateConfig();
    const result = getSignatureConfigFromHeader(
      config,
      createHeader({
        algorithm: createAlgorithmHeader(config, 'SHA256'),
        credentials: `${v4()}/11111111/${credentialScope}`,
      }),
      () => v4(),
    );
    expect(result.credentialScope).toEqual(credentialScope);
  });

  it('should returns hash algorithm', () => {
    const hashAlgo = 'SHA512';
    const config = createAuthenticateConfig();
    const result = getSignatureConfigFromHeader(
      config,
      createHeader({ algorithm: createAlgorithmHeader(config, hashAlgo) }),
      () => v4(),
    );
    expect(result.hashAlgo).toEqual(hashAlgo);
  });

  it('should throw error when header format is invalid', () => {
    const header = 'invalid header';
    expect(() => getSignatureConfigFromHeader(createAuthenticateConfig(), header, () => v4())).toThrow(
      new Error('Invalid auth header format'),
    );
  });

  it('should throw error when api secret is not string', () => {
    const keyDB = () => undefined;
    const config = createAuthenticateConfig();
    expect(() =>
      getSignatureConfigFromHeader(config, createHeader({ algorithm: createAlgorithmHeader(config, 'SHA256') }), keyDB),
    ).toThrow(new Error('Invalid Escher key'));
  });
});

function createHeader({
  algorithm = `${v4()}-HMAC-SHA256`,
  credentials = `${v4()}/19700101/${v4()}`,
  signedHeaders = 'signedHeader',
  signature = Number(3).toString(16),
} = {}): string {
  return `${algorithm} Credential=${credentials}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

function createAlgorithmHeader(config: AuthenticateConfig, algorithm: 'SHA256' | 'SHA512'): string {
  return `${config.algoPrefix}-HMAC-${algorithm}`;
}
