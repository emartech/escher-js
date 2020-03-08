import {
  EscherConfig,
  EscherRequest,
  EscherRequestHeader,
  EscherRequestHeaderValue,
  EscherRequestHeaderName,
  SignatureConfig,
  AuthenticateConfig,
} from './interface';
import { v4 } from 'uuid';
import { pipe, toPairs, map, fromPairs } from 'ramda';
import { ParsedUrlQuery } from 'querystring';

export const createEscherRequest = (override: Partial<EscherRequest> = {}): EscherRequest =>
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

export const createEscherRequestHeader = ({
  name = v4(),
  value = v4(),
}: Partial<{ name: EscherRequestHeaderName; value: EscherRequestHeaderValue }> = {}): EscherRequestHeader => [
  name,
  value,
];

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
  authHeaderName = v4(),
  dateHeaderName = v4(),
}: Partial<AuthenticateConfig> = {}): AuthenticateConfig => ({
  algoPrefix,
  vendorKey,
  clockSkew,
  credentialScope,
  authHeaderName,
  dateHeaderName,
});

export const createParsedUrlQuery = ({ query = {}, config = createAuthenticateConfig() } = {}): ParsedUrlQuery =>
  (pipe as any)(toPairs, map(([key, value]: any) => [`X-${config.vendorKey}-${key}`, value]), fromPairs)(query);
