import { HashAlgo } from '../../interface';

export type AuthorizationAlgoConfig = { hashAlgo: HashAlgo; algoPrefix: string };

export type GetAuthorizationAlgo = (config: AuthorizationAlgoConfig) => string;

export const getAuthorizationAlgo: GetAuthorizationAlgo = config => `${config.algoPrefix}-HMAC-${config.hashAlgo}`;
