export type EscherConfig = {
  algoPrefix: string;
  vendorKey: string;
  hashAlgo: string;
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
