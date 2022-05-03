import { split, join } from 'ramda';

export type GetCredentialScope = (credentials: string) => string;

export const getCredentialScope: GetCredentialScope = credentials => {
  const [, , ...credentialScopeParts] = split('/', credentials);
  return join('/', credentialScopeParts);
};
