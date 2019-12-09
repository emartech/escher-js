export type EscherConfig = {
  algoPrefix: string;
  vendorKey: string;
  hashAlgo: 'SHA256' | 'SHA512';
  credentialScope: string;
  authHeaderName: string;
  dateHeaderName: string;
  clockSkew: number;
};

export type ValidateMandatorySignedHeaders = (headers?: any) => void;

export type Request = {
  method?: any;
  body?: any;
  url: string;
  headers: [string, RequestHeaderValue][] | { [_: string]: RequestHeaderValue };
};

export type ValidateRequest = (request: Request, body?: any) => void;

export type RequestHeaderValue = string | number;

export type RequestHeaders = { [_: string]: RequestHeaderValue };

type RequestBase = {
  headers: RequestHeaders;
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
