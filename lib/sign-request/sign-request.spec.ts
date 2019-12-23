import { SignRequestStrategy, createSignRequest } from './sign-request';
import { v4 } from 'uuid';
import { createEscherConfig, createValidRequest, createRequestHeader } from '../factory';
import { dissoc } from 'ramda';

describe('SignRequest', () => {
  it('should calls validate request with request and body', () => {
    const validateRequest = jasmine.createSpy('validateRequest');
    const request = createValidRequest();
    const body = v4();

    createSignRequest(createStrategy({ validateRequest }))(createEscherConfig(), request, body, []);

    expect(validateRequest).toHaveBeenCalledWith(request, body);
  });

  it('should calls validate escher config with escher config', () => {
    const validateEscherConfig = jasmine.createSpy('validateEscherConfig');
    const config = createEscherConfig();

    createSignRequest(createStrategy({ validateEscherConfig }))(config, createValidRequest(), v4(), []);

    expect(validateEscherConfig).toHaveBeenCalledWith(config);
  });

  it('should calls get date header with config and date from get date', () => {
    const getDateHeader = jasmine.createSpy('getDateHeader').and.returnValue(createRequestHeader());
    const date = new Date();
    const config = createEscherConfig();

    createSignRequest(createStrategy({ getDateHeader, getDate: () => date }))(config, createValidRequest(), v4(), []);

    expect(getDateHeader).toHaveBeenCalledWith(config, date);
  });

  it('should calls get headers to sign with config and additional headers', () => {
    const getHeadersToSign = jasmine.createSpy('getHeadersToSign').and.returnValue([]);
    const config = createEscherConfig();
    const additionalHeaders = [v4()];

    createSignRequest(createStrategy({ getHeadersToSign }))(config, createValidRequest(), v4(), additionalHeaders);

    expect(getHeadersToSign).toHaveBeenCalledWith(config, additionalHeaders);
  });

  it('should calls get authorization header with config, date, request, body and headers to sign', () => {
    const getAuthorizationHeader = jasmine.createSpy('getAuthorizationHeader').and.returnValue(createRequestHeader());
    const config = createEscherConfig();
    const date = new Date();
    const request = createValidRequest();
    const body = v4();
    const headersToSign = [v4()];
    const additionalHeaders = [v4()];
    const dateHeader = createRequestHeader();

    createSignRequest(
      createStrategy({
        getAuthorizationHeader,
        getDate: () => date,
        getHeadersToSign: () => headersToSign,
        getDateHeader: () => dateHeader,
      }),
    )(config, request, body, additionalHeaders);

    expect(getAuthorizationHeader).toHaveBeenCalledWith(
      config,
      date,
      { ...request, headers: [...request.headers, dateHeader] },
      body,
      headersToSign,
    );
  });

  it('should calls get authorization header with config, date, request, body and headers to sign', () => {
    const request = createValidRequest();

    const result = createSignRequest(createStrategy())(createEscherConfig(), request, v4(), []);

    expect(dissoc('headers', result)).toEqual(dissoc('headers', request));
  });

  it('should add auth header to request', () => {
    const authorizationHeader = createRequestHeader({ name: 'Authorization' });

    const result = createSignRequest(createStrategy({ getAuthorizationHeader: () => authorizationHeader }))(
      createEscherConfig(),
      createValidRequest(),
      v4(),
      [],
    );

    expect(result.headers).toContain(authorizationHeader);
  });

  it('should add date header to request', () => {
    const dateHeader = createRequestHeader({ name: 'Date' });

    const result = createSignRequest(createStrategy({ getDateHeader: () => dateHeader }))(
      createEscherConfig(),
      createValidRequest(),
      v4(),
      [],
    );

    expect(result.headers).toContain(dateHeader);
  });

  it('should keep original headers of request', () => {
    const headers = [createRequestHeader()];
    const {
      headers: [header],
    } = createSignRequest(createStrategy())(createEscherConfig(), createValidRequest({ headers }), v4(), []);

    expect(header).toEqual(headers[0]);
  });

  it('should not add existed header to request', () => {
    const dateHeader = createRequestHeader({ name: 'Date', value: '[X]' });
    const originalHeader = createRequestHeader({ name: 'Date', value: '[Y]' });
    const result = createSignRequest(createStrategy({ getDateHeader: () => dateHeader }))(
      createEscherConfig(),
      createValidRequest({ headers: [originalHeader] }),
      v4(),
      [],
    );

    expect(result.headers).not.toContain(dateHeader);
  });
});

function createStrategy({
  getAuthorizationHeader = () => [v4(), v4()],
  getDate = () => new Date(),
  getDateHeader = () => [v4(), v4()],
  getHeadersToSign = () => [],
  validateRequest = () => {},
  validateEscherConfig = () => {},
}: Partial<SignRequestStrategy> = {}): SignRequestStrategy {
  return { getAuthorizationHeader, getDate, getDateHeader, getHeadersToSign, validateRequest, validateEscherConfig };
}
