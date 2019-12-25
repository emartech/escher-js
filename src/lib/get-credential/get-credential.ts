import { EscherConfig } from '../../interface';
import { convertToAwsShortDate } from '../convert-to-aws-short-date';

export type GetCredential = (config: EscherConfig, date: Date) => string;

export const getCredential: GetCredential = (config, date) =>
  `${config.accessKeyId}/${convertToAwsShortDate(date)}/${config.credentialScope}`;
