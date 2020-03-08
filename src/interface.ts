export type Authenticate = (
  config: AuthenticateConfig,
  request: EscherRequest,
  keyDB: Function,
  mandatorySignedHeaders: string[] | undefined,
) => string;

export type PresignUrl = (config: EscherConfig, url: string, expiration: number, date: Date) => string;

export type SignRequest = (
  config: EscherConfig,
  requestToSign: EscherRequest,
  body: EscherRequestBody,
  additionalHeadersToSign: string[],
) => EscherRequest;

export type ValidateMandatorySignedHeaders = (headers?: string[]) => void;

export type ValidateRequest = (request: EscherRequest, body?: any) => void;

export type EscherConfig = {
  accessKeyId: string;
  algoPrefix: string;
  vendorKey: string;
  hashAlgo: 'SHA256' | 'SHA512';
  credentialScope: string;
  authHeaderName: string;
  dateHeaderName: string;
  clockSkew: number;
  apiSecret?: string;
};

export type EscherRequestHeaderValue = string | number;

export type EscherRequestHeaderName = string;

export type EscherRequestHeader = [EscherRequestHeaderName, EscherRequestHeaderValue];

type EscherRequestBase = {
  headers: EscherRequestHeader[];
  url: string;
};

export type EscherRequestBody = string | Buffer;

type RequestWithoutBody = {
  method: 'OPTIONS' | 'GET' | 'HEAD' | 'DELETE' | 'TRACE' | 'CONNECT';
} & EscherRequestBase;

type EscherRequestWithBody = {
  method: 'PUT' | 'POST' | 'PATCH';
  body: EscherRequestBody;
} & EscherRequestBase;

export type EscherRequest = RequestWithoutBody | EscherRequestWithBody;

export type SignatureConfig = {
  hashAlgo: 'SHA256' | 'SHA512';
  algoPrefix: string;
  apiSecret: string;
  credentialScope: string;
};

export type AuthenticateConfig = {
  algoPrefix: string;
  vendorKey: string;
  clockSkew: number;
  credentialScope: string;
  authHeaderName: string;
  dateHeaderName: string;
};
