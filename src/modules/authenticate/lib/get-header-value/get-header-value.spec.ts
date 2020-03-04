import { v4 } from 'uuid';
import { getHeaderValue } from './get-header-value';
import { createValidRequest, createRequestHeader } from '../../../../factory';

describe('Get Header Value', () => {
  it('should return header value', () => {
    const name = v4();
    const value = v4();
    const request = createValidRequest({ headers: [createRequestHeader({ name, value })] });

    const result = getHeaderValue(request, name);

    expect(result).toEqual(value);
  });

  it('should normalize header name', () => {
    const name = '   [X]   ';
    const value = v4();
    const request = createValidRequest({ headers: [createRequestHeader({ name, value })] });

    const result = getHeaderValue(request, '[X]');

    expect(result).toEqual(value);
  });

  it('should throw error when header is not exists', () => {
    const headerName = '[X]';
    const soughtHeaderName = '[Y]';
    const request = createValidRequest({ headers: [createRequestHeader({ name: headerName })] });

    expect(() => getHeaderValue(request, soughtHeaderName)).toThrow(new Error(`The [Y] header is missing`));
  });
});
