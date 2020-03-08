import { validateRequest } from './validate-request';
import { createEscherRequest } from '../../factory';
import { v4 } from 'uuid';
import { EscherRequestHeader } from '../../interface';

describe('Validate Request', () => {
  [
    {
      should: 'throw error when method is not string',
      request: createEscherRequest({ method: 1 } as any),
      expectedError: new Error('The request method is invalid'),
    },
    {
      should: 'throw error when method is not allowed method',
      request: createEscherRequest({ method: 'invalid method' } as any),
      expectedError: new Error('The request method is invalid'),
    },
    {
      should: 'throw error when url starts with http://',
      request: createEscherRequest({ method: 'GET', url: 'http://index.hu' }),
      expectedError: new Error(`The request url shouldn't contains http or https`),
    },
    {
      should: 'throw error when url starts with https://',
      request: createEscherRequest({ method: 'GET', url: 'https://index.hu' }),
      expectedError: new Error(`The request url shouldn't contains http or https`),
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      expect(() => validateRequest(testCase.request)).toThrow(testCase.expectedError);
    });
  });

  describe('body required methods', () => {
    [
      { request: createEscherRequest({ method: 'POST', body: v4() }) },
      { request: createEscherRequest({ method: 'PUT', body: v4() }) },
      { request: createEscherRequest({ method: 'PATCH', body: v4() }) },
      { request: createEscherRequest({ method: 'POST', body: Buffer.from(v4()) }) },
      { request: createEscherRequest({ method: 'PUT', body: Buffer.from(v4()) }) },
      { request: createEscherRequest({ method: 'PATCH', body: Buffer.from(v4()) }) },
    ].forEach(testCase => {
      it(`should not throw error when method is ${
        testCase.request.method
      } body type is ${typeof (testCase.request as any).body}`, () => {
        validateRequest(testCase.request);
      });
    });
  });

  [
    { request: createEscherRequest({ method: 'OPTIONS' }) },
    { request: createEscherRequest({ method: 'GET' }) },
    { request: createEscherRequest({ method: 'HEAD' }) },
    { request: createEscherRequest({ method: 'DELETE' }) },
    { request: createEscherRequest({ method: 'TRACE' }) },
    { request: createEscherRequest({ method: 'CONNECT' }) },
  ].forEach(testCase => {
    it(`should not throw error when method is ${testCase.request.method}`, () => {
      validateRequest(testCase.request);
    });
  });

  ['POST', 'PUT', 'PATCH'].forEach(method => {
    it(`should throw error when method is ${method} and request body is not string or buffer`, () => {
      const body = 1;
      expect(() => validateRequest(createEscherRequest({ method, body }  as any))).toThrow(
        new Error(`The request body shouldn't be empty if the request method is ${method}`),
      );
    });
  });

  it(`should not throw error when url does not start with http:// or https://`, () => {
    const url = '/example';
    validateRequest(createEscherRequest({ method: 'GET', url }));
  });

  describe('body passed', () => {
    describe('body required methods', () => {
      [
        { request: createEscherRequest({ method: 'POST' }), body: v4() },
        { request: createEscherRequest({ method: 'PUT' }), body: v4() },
        { request: createEscherRequest({ method: 'PATCH' }), body: v4() },
        { request: createEscherRequest({ method: 'POST' }), body: Buffer.from(v4()) },
        { request: createEscherRequest({ method: 'PUT' }), body: Buffer.from(v4()) },
        { request: createEscherRequest({ method: 'PATCH' }), body: Buffer.from(v4()) },
      ].forEach(testCase => {
        it(`should not throw error when method is ${
          testCase.request.method
        } body type is ${typeof testCase.body}`, () => {
          validateRequest(testCase.request, testCase.body);
        });
      });
    });
  });

  [
    {
      should: 'throw error when header value is a Buffer and headers is an array',
      headers: [['headerName', Buffer.from(v4())]],
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      expect(() =>
        validateRequest(createEscherRequest({ method: 'GET', headers: testCase.headers as EscherRequestHeader[] })),
      ).toThrow(new Error('Header value should be string or number [headerName]'));
    });
  });

  [
    {
      should: 'not throw error when header value is a number and headers is an array',
      headers: [['headerName', 3]],
    },
    {
      should: 'not throw error when header value is a string and headers is an array',
      headers: [['headerName', v4()]],
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      validateRequest(createEscherRequest({ method: 'GET', headers: testCase.headers as EscherRequestHeader[] }));
    });
  });
});
