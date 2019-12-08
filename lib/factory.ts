import { Request, EscherConfig, ValidRequest } from './interface';
import { v4 } from 'uuid';

export const createRequest = (override: Partial<Request> = {}): Request => ({ url: 'http://index.hu', ...override });

export const createValidRequest = (override: Partial<ValidRequest> = {}): ValidRequest =>
  ({
    method: 'GET',
    url: 'http://index.hu',
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
