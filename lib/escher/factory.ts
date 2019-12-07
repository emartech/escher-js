import { Request } from './interface';
import { v4 } from 'uuid';

export const createRequest = (override: Partial<Request> = {}) => ({ url: 'http://index.hu', ...override });

export const createValidRequest = (override: Partial<Request> = {}) => ({
  method: 'POST',
  url: 'http://index.hu',
  body: v4(),
  ...override,
});
