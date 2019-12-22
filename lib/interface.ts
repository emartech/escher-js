export type EscherConfig = {
  accessKeyId: string;
  algoPrefix: string;
  vendorKey: string;
  hashAlgo: 'SHA256' | 'SHA512';
  credentialScope: string;
  authHeaderName: string;
  dateHeaderName: string;
  clockSkew: number;
  apiSecret: string;
};

export type Request = {
  method?: any;
  body?: any;
  url: string;
  headers: [string, RequestHeaderValue][];
};

export type RequestHeaderValue = string | number;

export type RequestHeaderName = string;

export type RequestHeader = [RequestHeaderName, RequestHeaderValue];

type RequestBase = {
  headers: RequestHeader[];
  url: string;
};

export type RequestBody = string | Buffer;

type RequestWithoutBody = {
  method: 'OPTIONS' | 'GET' | 'HEAD' | 'DELETE' | 'TRACE' | 'CONNECT';
} & RequestBase;

type RequestWithBody = {
  method: 'PUT' | 'POST' | 'PATCH';
  body: RequestBody;
} & RequestBase;

export type ValidRequest = RequestWithoutBody | RequestWithBody;

export type ValidateRequest = (request: Request, body?: any) => void;

export type ValidateMandatorySignedHeaders = (headers?: any) => void;
