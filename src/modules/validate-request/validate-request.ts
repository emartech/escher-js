import { ValidateRequest, EscherRequest, EscherRequestBody } from '../../interface';
import { includes, is, test, forEach, propOr } from 'ramda';

export const validateRequest: ValidateRequest = (request, body) => {
  validateMethod(request);
  validateBody(request, body);
  validateUrl(request);
  validateHeaderValues(request);
};

function validateMethod(request: EscherRequest): void {
  if (!isAllowedMethod(request)) {
    throw new Error('The request method is invalid');
  }
}

function isAllowedMethod(request: EscherRequest): boolean {
  return includes(request.method, ['OPTIONS', 'GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'TRACE', 'PATCH', 'CONNECT']);
}

function validateBody(request: EscherRequest, body?: EscherRequestBody): void {
  const validatableBody = propOr(body, 'body', request) as EscherRequestBody;
  if (isBodyRequiredMethod(request) && !(is(String, validatableBody) || is(Buffer, validatableBody))) {
    throw new Error(`The request body shouldn't be empty if the request method is ${request.method}`);
  }
}

function isBodyRequiredMethod(request: EscherRequest): boolean {
  return includes(request.method, ['POST', 'PUT', 'PATCH']);
}

function validateUrl(request: EscherRequest): void {
  if (test(/^https?:\/\//, request.url)) {
    throw new Error(`The request url shouldn't contains http or https`);
  }
}

function validateHeaderValues(request: EscherRequest): void {
  forEach(([headerName, headerValue]) => {
    if (!is(String, headerValue) && !is(Number, headerValue)) {
      throw new Error(`Header value should be string or number [${headerName}]`);
    }
  }, request.headers);
}
