export interface BaseConfig {
  vendorKey: string;
  algoPrefix: string;
  hashAlgo: string;
  credentialScope: string;
  apiSecret: string;
  accessKeyId: string;
}

export interface Config extends BaseConfig {
  authHeaderName: string;
  dateHeaderName: string;
  clockSkew: number;
}

export interface ParsedConfig extends BaseConfig {
  date: Date;
}

export interface PartsConfig {
  shortDate: string;
  config: ParsedConfig;
  signedHeaders: string[];
  signature: string;
  expires?: string;
}

export type AllowedRequestMethods =
  | 'OPTIONS'
  | 'GET'
  | 'HEAD'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'TRACE'
  | 'PATCH'
  | 'CONNECT';

export interface RequestOptions {
  method: AllowedRequestMethods;
  url: string;
  headers: string[][];
  host?: string;
  port?: number;
  body?: string | Buffer;
}

export type KeyDB = (key: string) => string;
