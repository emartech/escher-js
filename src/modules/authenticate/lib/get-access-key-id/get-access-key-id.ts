import { split } from 'ramda';

export type GetAccessKeyId = (credentials: string) => string;

export const getAccessKeyId: GetAccessKeyId = credentials => {
  const [accessKeyId] = split('/', credentials);
  return accessKeyId;
};
