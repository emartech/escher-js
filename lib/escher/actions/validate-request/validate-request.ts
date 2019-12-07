import { ValidateRequest, Request } from '../../interface';
import { includes, is, test } from 'ramda';

export const validateRequest: ValidateRequest = (request, body) => {
  validateMethod(request);
  validateBody(request, body);
  validateUrl(request);
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
