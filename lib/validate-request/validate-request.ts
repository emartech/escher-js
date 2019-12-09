import { ValidateRequest, Request, RequestHeaderValue } from '../interface';
import { includes, is, test, forEach, toPairs } from 'ramda';

export const validateRequest: ValidateRequest = (request, body) => {
  validateMethod(request);
  validateBody(request, body);
  validateUrl(request);
  validateHeaderValues(request);
};

function validateMethod(request: Request): void {
  if (!isAllowedMethod(request)) {
    throw new Error('The request method is invalid');
  }
}

function isAllowedMethod(request: Request): boolean {
  return includes(request.method, ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'PATCH', 'CONNECT']);
}

function validateBody(request: Request, body?: any): void {
  const validatableBody = request.body === undefined ? body : request.body;
  if (isBodyRequiredMethod(request) && !(is(String, validatableBody) || is(Buffer, validatableBody))) {
    throw new Error(`The request body shouldn't be empty if the request method is ${request.method}`);
  }
}

function isBodyRequiredMethod(request: Request): boolean {
  return includes(request.method, ['POST', 'PUT', 'PATCH']);
}

function validateUrl(request: Request): void {
  if (!test(/^https?:\/\//, request.url)) {
    throw new Error(`The request url shouldn't contains http or https`);
  }
}

function validateHeaderValues(request: Request): void {
  const headers = is(Array, request.headers)
    ? (request.headers as [string, RequestHeaderValue][])
    : toPairs(request.headers as { [_: string]: RequestHeaderValue });
  forEach(([headerName, headerValue]) => {
    if (!is(String, headerValue) && !is(Number, headerValue)) {
      throw new Error(`Header value should be string or number [${headerName}]`);
    }
  }, headers);
}
