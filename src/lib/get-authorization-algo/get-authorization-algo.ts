import { EscherConfig } from '../../interface';

export type GetAuthorizationAlgo = (config: EscherConfig) => string;

export const getAuthorizationAlgo: GetAuthorizationAlgo = config => `${config.algoPrefix}-HMAC-${config.hashAlgo}`;
