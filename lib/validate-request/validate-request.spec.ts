import { validateRequest } from './validate-request';
import { createRequest, createValidRequest } from '../escher/factory';
import { v4 } from 'uuid';

describe('Validate Request', () => {
  [
    {
      should: 'throw error when method is not string',
      request: createRequest({ method: 1 }),
      expectedError: new Error('The request method is invalid'),
    },
    {
      should: 'throw error when method is not allowed method',
      request: createRequest({ method: 'invalid method' }),
      expectedError: new Error('The request method is invalid'),
    },
    {
      should: 'throw error when url does not start with http:// or https://',
      request: createRequest({ method: 'GET', url: 'invalid url' }),
      expectedError: new Error(`The request url shouldn't contains http or https`),
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      expect(() => validateRequest(testCase.request)).toThrow(testCase.expectedError);
    });
  });

  describe('body required methods', () => {
    [
      { request: createValidRequest({ method: 'POST', body: v4() }) },
      { request: createValidRequest({ method: 'PUT', body: v4() }) },
      { request: createValidRequest({ method: 'PATCH', body: v4() }) },
      { request: createValidRequest({ method: 'POST', body: Buffer.from(v4()) }) },
      { request: createValidRequest({ method: 'PUT', body: Buffer.from(v4()) }) },
      { request: createValidRequest({ method: 'PATCH', body: Buffer.from(v4()) }) },
    ].forEach(testCase => {
      it(`should not throw error when method is ${testCase.request.method} body type is ${typeof testCase.request
        .body}`, () => {
        validateRequest(testCase.request);
      });
    });
  });

  [
    { request: createValidRequest({ method: 'OPTIONS' }) },
    { request: createValidRequest({ method: 'GET' }) },
    { request: createValidRequest({ method: 'HEAD' }) },
    { request: createValidRequest({ method: 'DELETE' }) },
    { request: createValidRequest({ method: 'TRACE' }) },
    { request: createValidRequest({ method: 'CONNECT' }) },
  ].forEach(testCase => {
    it(`should not throw error when method is ${testCase.request.method}`, () => {
      validateRequest(testCase.request);
    });
  });

  ['POST', 'PUT', 'PATCH'].forEach(method => {
    it(`should throw error when method is ${method} and request body is not string or buffer`, () => {
      const body = 1;
      expect(() => validateRequest(createRequest({ method, body }))).toThrow(
        new Error(`The request body shouldn't be empty if the request method is ${method}`),
      );
    });
  });

  [
    {
      should: 'not throw error when url starts with https://',
      request: createRequest({ method: 'GET', url: 'https://' }),
    },
    {
      should: 'not throw error when url starts with http://',
      request: createRequest({ method: 'GET', url: 'http://' }),
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      validateRequest(testCase.request);
    });
  });

  describe('body passed', () => {
    describe('body required methods', () => {
      [
        { request: createRequest({ method: 'POST' }), body: v4() },
        { request: createRequest({ method: 'PUT' }), body: v4() },
        { request: createRequest({ method: 'PATCH' }), body: v4() },
        { request: createRequest({ method: 'POST' }), body: Buffer.from(v4()) },
        { request: createRequest({ method: 'PUT' }), body: Buffer.from(v4()) },
        { request: createRequest({ method: 'PATCH' }), body: Buffer.from(v4()) },
      ].forEach(testCase => {
        it(`should not throw error when method is ${
          testCase.request.method
        } body type is ${typeof testCase.body}`, () => {
          validateRequest(testCase.request, testCase.body);
        });
      });
    });
  });
});
