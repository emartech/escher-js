import { createAuthenticateConfig, createParsedUrlQuery } from '../../../../factory';
import { v4 } from 'uuid';
import { getSignatureConfigFromQuery } from './get-signature-config-from-query';

describe('Get Signature Config From Query', () => {
  it('should return algoPrefix from authenticate config', () => {
    const algoPrefix = v4();
    const config = createAuthenticateConfig({ algoPrefix });

    const result = getSignatureConfigFromQuery(config, createParsedUrlQuery(), () => {});

    expect(result.algoPrefix).toEqual(algoPrefix);
  });

  it('should call keyDB with access key id', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({
      config,
      query: createQuery({ Credentials: 'AKIDEXAMPLE/19780210/escher_request' }),
    });
    const keyDB = jasmine.createSpy('keyDB');

    getSignatureConfigFromQuery(config, query, keyDB);

    expect(keyDB).toHaveBeenCalledWith('AKIDEXAMPLE');
  });

  it('should return apiSecret from keyDB', () => {
    const apiSecret = v4();
    const keyDB = () => apiSecret;

    const result = getSignatureConfigFromQuery(createAuthenticateConfig(), createParsedUrlQuery(), keyDB);

    expect(result.apiSecret).toEqual(apiSecret);
  });

  it('should return credential scope', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({
      config,
      query: createQuery({ Credentials: 'AKIDEXAMPLE/19780210/escher_request/example/scope' }),
    });

    const result = getSignatureConfigFromQuery(config, query, () => {});

    expect(result.credentialScope).toEqual('escher_request/example/scope');
  });

  it('should return credential scope', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({
      config,
      query: createQuery({ Credentials: 'AKIDEXAMPLE/19780210/escher_request/example/scope' }),
    });

    const result = getSignatureConfigFromQuery(config, query, () => {});

    expect(result.credentialScope).toEqual('escher_request/example/scope');
  });

  it('should return hash algo', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({
      config,
      query: createQuery({ Algorithm: 'HMAC-SHA512' }),
    });

    const result = getSignatureConfigFromQuery(config, query, () => {});

    expect(result.hashAlgo).toEqual('SHA512');
  });
});

function createQuery(override = {}): object {
  return { Credentials: 'AKIDEXAMPLE/19780210/escher_request', Algorithm: 'HMAC-SHA256', ...override };
}
