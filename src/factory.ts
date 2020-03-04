import {
  Request,
  EscherConfig,
  ValidRequest,
  RequestHeader,
  RequestHeaderValue,
  RequestHeaderName,
  SignatureConfig,
  AuthenticateConfig,
} from './interface';
import { v4 } from 'uuid';
import { pipe, toPairs, map, fromPairs } from 'ramda';
import { ParsedUrlQuery } from 'querystring';

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

export const createAuthenticateConfig = ({
  algoPrefix = v4(),
  vendorKey = v4(),
  clockSkew = 0,
  credentialScope = v4(),
}: Partial<AuthenticateConfig> = {}): AuthenticateConfig => ({ algoPrefix, vendorKey, clockSkew, credentialScope });

export const createParsedUrlQuery = ({ query = {}, config = createAuthenticateConfig() } = {}): ParsedUrlQuery =>
  (pipe as any)(toPairs, map(([key, value]: any) => [`X-${config.vendorKey}-${key}`, value]), fromPairs)(query);
