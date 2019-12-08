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
};

export type ValidateRequest = (request: Request, body?: any) => void;

export type RequestHeaders = { [key: string]: string | number };

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
