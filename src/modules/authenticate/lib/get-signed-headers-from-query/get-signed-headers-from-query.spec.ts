import { createAuthenticateConfig, createParsedUrlQuery } from '../../../../factory';
import { getSignedHeadersFromQuery } from './get-signed-headers-from-query';

describe('Get Signed Header From Query', () => {
  it('should retrun with signed headers', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({ config, query: { SignedHeaders: '[X];[Y]' } });
    const result = getSignedHeadersFromQuery(config, query);
    expect(result).toEqual(['[X]', '[Y]']);
  });
});
