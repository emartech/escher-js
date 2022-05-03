import { getAccessKeyId } from '../get-access-key-id';

export type GetApiSecret = (credentials: string, keyDB: Function) => string;

export const getApiSecret: GetApiSecret = (credentials, keyDB) => {
  const accessKeyId = getAccessKeyId(credentials);
  return keyDB(accessKeyId);
};
