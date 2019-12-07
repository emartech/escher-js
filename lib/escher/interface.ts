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
