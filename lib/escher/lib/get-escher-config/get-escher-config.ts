import { EscherConfig } from '../../../../interface';
import { defaultTo } from 'ramda';

export type GetEscherConfig = (partialConfig?: Partial<EscherConfig>) => EscherConfig;

export const getEscherConfig: GetEscherConfig = partialConfig => ({
  algoPrefix: 'ESR',
  vendorKey: 'ESCHER',
  hashAlgo: 'SHA256',
  credentialScope: 'escher_request',
  authHeaderName: 'X-Escher-Auth',
  dateHeaderName: 'X-Escher-Date',
  clockSkew: 300,
  ...defaultTo({}, partialConfig)
});
