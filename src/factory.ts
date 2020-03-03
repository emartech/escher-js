import {
  Request,
  EscherConfig,
  ValidRequest,
  RequestHeader,
  RequestHeaderValue,
  RequestHeaderName,
  SignatureConfig,
} from './interface';
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

export const createEscherConfig = (override: Partial<EscherConfig> = {}): EscherConfig => ({
  algoPrefix: v4(),
  vendorKey: v4(),
  hashAlgo: 'SHA512',
  credentialScope: v4(),
  authHeaderName: v4(),
  dateHeaderName: v4(),
  clockSkew: 600,
  accessKeyId: v4(),
  ...override,
});

export const createRequestHeader = ({
  name = v4(),
  value = v4(),
}: Partial<{ name: RequestHeaderName; value: RequestHeaderValue }> = {}): RequestHeader => [name, value];

export const createSignatureConfig = ({
  algoPrefix = v4(),
  apiSecret = v4(),
  credentialScope = v4(),
  hashAlgo = 'SHA256',
}: Partial<SignatureConfig> = {}): SignatureConfig => ({ algoPrefix, apiSecret, credentialScope, hashAlgo });
