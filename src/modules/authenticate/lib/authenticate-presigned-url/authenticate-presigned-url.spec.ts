import { AuthenticatePresignedUrlStrategy, createAuthenticatePresignedUrl } from './authenticate-presigned-url';
import { v4 } from 'uuid';
import {
  createSignatureConfig,
  createAuthenticateConfig,
  createValidRequest,
  createParsedUrlQuery,
} from '../../../../factory';

describe('Create Authenticate Presigned Url', () => {
  it('should calls getUrlWithParsedQuery with query url', () => {
    const url = v4();
    const getUrlWithParsedQuery = jasmine.createSpy('getUrlWithParsedQuery').and.returnValue({});
    createAuthenticatePresignedUrl(createStrategy({ getUrlWithParsedQuery }))(
      createAuthenticateConfig(),
      createValidRequest({ url }),
      () => {},
      [],
      new Date(),
    );
    expect(getUrlWithParsedQuery).toHaveBeenCalledWith(url);
  });

  it('should calls getSignedHeadersFromQuery with config and query', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery();
    const getSignedHeadersFromQuery = jasmine.createSpy('getSignedHeadersFromQuery').and.returnValue([]);
    const getUrlWithParsedQuery = () => ({ query } as any);
    createAuthenticatePresignedUrl(createStrategy({ getUrlWithParsedQuery, getSignedHeadersFromQuery }))(
      config,
      createValidRequest(),
      () => {},
      [],
      new Date(),
    );
    expect(getSignedHeadersFromQuery).toHaveBeenCalledWith(config, query);
  });

  it('should calls getSignatureConfig with config, query, keyDB', () => {
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery();
    const keyDB = () => {};
    const getSignatureConfig = jasmine.createSpy('getSignatureConfig').and.returnValue(createSignatureConfig());
    const getUrlWithParsedQuery = () => ({ query } as any);
    createAuthenticatePresignedUrl(createStrategy({ getUrlWithParsedQuery, getSignatureConfig }))(
      config,
      createValidRequest(),
      keyDB,
      [],
      new Date(),
    );
    expect(getSignatureConfig).toHaveBeenCalledWith(config, query, keyDB);
  });

  it('should calls getSignedHeadersFromQuery with config and query', () => {
    const mandatorySignedHeader = v4();
    const signedHeaders = [v4()];
    const getSignedHeadersFromQuery = () => signedHeaders;
    const checkMandatorySignHeaders = jasmine.createSpy('checkMandatorySignHeaders');
    createAuthenticatePresignedUrl(createStrategy({ getSignedHeadersFromQuery, checkMandatorySignHeaders }))(
      createAuthenticateConfig(),
      createValidRequest(),
      () => {},
      [mandatorySignedHeader],
      new Date(),
    );
    expect(checkMandatorySignHeaders).toHaveBeenCalledWith(signedHeaders, [mandatorySignedHeader, 'host']);
  });

  it('should calls checkSignatureConfig with config and signatureConfig', () => {
    const config = createAuthenticateConfig();
    const signatureConfig = createSignatureConfig();
    const checkSignatureConfig = jasmine.createSpy('checkSignatureConfig');
    const getSignatureConfig = () => signatureConfig;
    createAuthenticatePresignedUrl(createStrategy({ checkSignatureConfig, getSignatureConfig }))(
      config,
      createValidRequest(),
      () => {},
      [],
      new Date(),
    );
    expect(checkSignatureConfig).toHaveBeenCalledWith(config, signatureConfig);
  });

  it('should calls checkRequestDate with config, credentials, request date, expires and current date', () => {
    const credentials = v4();
    const expires = 0;
    const requestDate = new Date().toISOString();
    const config = createAuthenticateConfig();
    const query = createParsedUrlQuery({
      config,
      query: { Credentials: credentials, Date: requestDate, Expires: expires.toString() },
    });
    const date = new Date();
    const checkRequestDate = jasmine.createSpy('checkRequestDate');
    const getUrlWithParsedQuery = () => ({ query } as any);
    createAuthenticatePresignedUrl(createStrategy({ checkRequestDate, getUrlWithParsedQuery }))(
      config,
      createValidRequest(),
      () => {},
      [],
      date,
    );
    expect(checkRequestDate).toHaveBeenCalledWith(config, credentials, requestDate, expires, date);
  });

  it('should calls checkSignature with config, signature config, url with parsed query, request and signed headers', () => {
    const urlWithParsedQuery = { query: createParsedUrlQuery() } as any;
    const signedHeaders = [v4()];
    const config = createAuthenticateConfig();
    const signatureConfig = createSignatureConfig();
    const date = new Date();
    const request = createValidRequest();
    const getUrlWithParsedQuery = () => urlWithParsedQuery;
    const getSignatureConfig = () => signatureConfig;
    const getSignedHeadersFromQuery = () => signedHeaders;
    const checkSignature = jasmine.createSpy('checkSignature');
    createAuthenticatePresignedUrl(
      createStrategy({ checkSignature, getUrlWithParsedQuery, getSignatureConfig, getSignedHeadersFromQuery }),
    )(config, request, () => {}, [], date);
    expect(checkSignature).toHaveBeenCalledWith(config, signatureConfig, urlWithParsedQuery, request, signedHeaders);
  });

  it('should calls getAccessKeyId with Credentials query', () => {
    const config = createAuthenticateConfig();
    const credentials = v4();
    const query = createParsedUrlQuery({ config, query: { Credentials: credentials } });
    const getAccessKeyId = jasmine.createSpy('getAccessKeyId');
    const getUrlWithParsedQuery = () => ({ query } as any);
    createAuthenticatePresignedUrl(createStrategy({ getAccessKeyId, getUrlWithParsedQuery }))(
      config,
      createValidRequest(),
      () => {},
      [],
      new Date(),
    );
    expect(getAccessKeyId).toHaveBeenCalledWith(credentials);
  });

  it('should return acces key id', () => {
    const accessKeyId = v4();
    const getAccessKeyId = () => accessKeyId;
    const result = createAuthenticatePresignedUrl(createStrategy({ getAccessKeyId }))(
      createAuthenticateConfig(),
      createValidRequest(),
      () => {},
      [],
      new Date(),
    );
    expect(result).toEqual(accessKeyId);
  });
});

function createStrategy({
  checkMandatorySignHeaders = () => [],
  checkRequestDate = () => {},
  checkSignature = () => {},
  checkSignatureConfig = () => {},
  getAccessKeyId = () => v4(),
  getSignatureConfig = () => createSignatureConfig(),
  getSignedHeadersFromQuery = () => [],
  getUrlWithParsedQuery = () => ({} as any),
}: Partial<AuthenticatePresignedUrlStrategy> = {}): AuthenticatePresignedUrlStrategy {
  return {
    checkMandatorySignHeaders,
    checkRequestDate,
    checkSignature,
    checkSignatureConfig,
    getAccessKeyId,
    getSignatureConfig,
    getSignedHeadersFromQuery,
    getUrlWithParsedQuery,
  };
}
