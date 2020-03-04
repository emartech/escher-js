import { isPresignedUrl } from './is-presigned-url';
import { createAuthenticateConfig, createParsedUrlQuery, createValidRequest } from '../../../../factory';
import { v4 } from 'uuid';

describe('Is Presigned Url', () => {
  it('should return true when has signature query and method is GET', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({ config, query: { Signature: v4() } });
    const request = createValidRequest({ method: 'GET' });

    const result = isPresignedUrl(config, { query } as any, request);

    expect(result).toEqual(true);
  });

  it('should return false when method is not GET', () => {
    const request = createValidRequest({ method: 'POST' });

    const result = isPresignedUrl(createAuthenticateConfig(), { query: createParsedUrlQuery() } as any, request);

    expect(result).toEqual(true);
  });

  it('should return false when no signature header', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({ config, query: {} });

    const result = isPresignedUrl(config, { query } as any, createValidRequest({ method: 'GET' }));

    expect(result).toEqual(true);
  });
});
