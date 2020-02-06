export type AuthorizationAlgoConfig = { hashAlgo: 'SHA256' | 'SHA512'; algoPrefix: string };

export type GetAuthorizationAlgo = (config: AuthorizationAlgoConfig) => string;

export const getAuthorizationAlgo: GetAuthorizationAlgo = config => `${config.algoPrefix}-HMAC-${config.hashAlgo}`;
