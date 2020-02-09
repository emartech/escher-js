import { convertToAwsShortDate } from '../convert-to-aws-short-date';

export type CredentialConfig = {
  accessKeyId: string;
  credentialScope: string;
};

export type GetCredential = (config: CredentialConfig, date: Date) => string;

export const getCredential: GetCredential = (config, date) =>
  `${config.accessKeyId}/${convertToAwsShortDate(date)}/${config.credentialScope}`;
