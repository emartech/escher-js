import { AuthorizationAlgoConfig, getAuthorizationAlgo } from './get-authorization-algo';
import { v4 } from 'uuid';

describe('Get Authorization Algo', () => {
  it('should generate authorization algo', () => {
    const algoPrefix = v4();
    const hashAlgo = 'SHA512';
    const config = createAuthorizationAlgoConfig({ algoPrefix, hashAlgo });

    const result = getAuthorizationAlgo(config);

    expect(result).toEqual(`${algoPrefix}-HMAC-${hashAlgo}`);
  });
});

function createAuthorizationAlgoConfig({
  algoPrefix = v4(),
  hashAlgo = 'SHA256',
}: Partial<AuthorizationAlgoConfig> = {}): AuthorizationAlgoConfig {
  return { hashAlgo, algoPrefix };
}
