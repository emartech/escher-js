export type Authenticate = (
  config: AuthenticateConfig,
  request: EscherRequest,
  keyDB: Function,
  mandatorySignedHeaders: string[] | undefined,
) => string;

export type PresignUrl = (config: PresignUrlConfig, url: string, expiration: number, date: Date) => string;

export type SignRequest = (
  config: SignRequestConfg,
  requestToSign: EscherRequest,
  body: EscherRequestBody,
  additionalHeadersToSign: string[],
) => EscherRequest;

export type ValidateMandatorySignedHeaders = (headers?: string[]) => void;

export type ValidateRequest = (request: EscherRequest, body?: any) => void;

export type AuthenticateConfig = {
  algoPrefix: string;
  vendorKey: string;
  clockSkew: number;
  credentialScope: string;
  authHeaderName: string;
  dateHeaderName: string;
};

export type SignRequestConfg = {
  hashAlgo: HashAlgo;
  algoPrefix: string;
  authHeaderName: string;
  accessKeyId: string;
  credentialScope: string;
  apiSecret: string;
  dateHeaderName: string;
};

export type PresignUrlConfig = {
  hashAlgo: HashAlgo;
  algoPrefix: string;
  accessKeyId: string;
  credentialScope: string;
  apiSecret: string;
  vendorKey: string;
};

export type EscherConfig = {
  accessKeyId: string;
  algoPrefix: string;
  vendorKey: string;
  hashAlgo: HashAlgo;
  credentialScope: string;
  authHeaderName: string;
  dateHeaderName: string;
  clockSkew: number;
  apiSecret?: string;
};

export type EscherRequest = RequestWithoutBody | EscherRequestWithBody;

type RequestWithoutBody = {
  method: 'OPTIONS' | 'GET' | 'HEAD' | 'DELETE' | 'TRACE' | 'CONNECT';
} & EscherRequestBase;

type EscherRequestWithBody = {
  method: 'PUT' | 'POST' | 'PATCH';
  body: EscherRequestBody;
} & EscherRequestBase;

type EscherRequestBase = {
  headers: EscherRequestHeader[];
  url: string;
};

export type EscherRequestBody = string | Buffer;

export type EscherRequestHeader = [EscherRequestHeaderName, EscherRequestHeaderValue];

export type EscherRequestHeaderName = string;

export type EscherRequestHeaderValue = string | number;

export type SignatureConfig = {
  hashAlgo: HashAlgo;
  algoPrefix: string;
  apiSecret: string;
  credentialScope: string;
};

export type HashAlgo = 'SHA256' | 'SHA512';
