import { Request, EscherConfig, ValidRequest, RequestHeader, RequestHeaderValue, RequestHeaderName } from './interface';
import { v4 } from 'uuid';

export const createRequest = (override: Partial<Request> = {}): Request => ({
  url: '/example',
  headers: [],
  ...override,
});

export const createValidRequest = (override: Partial<ValidRequest> = {}): ValidRequest =>
  ({
    method: 'GET',
    url: '/example',
    headers: [],
    ...override,
  } as any);

export const createEscherConfig = ({
  algoPrefix = v4(),
  vendorKey = v4(),
  hashAlgo = 'SHA512',
  credentialScope = v4(),
  authHeaderName = v4(),
  dateHeaderName = v4(),
  clockSkew = 600,
}: Partial<EscherConfig> = {}): EscherConfig => ({
  algoPrefix,
  authHeaderName,
  clockSkew,
  credentialScope,
  dateHeaderName,
  hashAlgo,
  vendorKey,
});

export const createRequestHeader = ({
  name = v4(),
  value = v4(),
}: Partial<{ name: RequestHeaderName; value: RequestHeaderValue }> = {}): RequestHeader => [name, value];
