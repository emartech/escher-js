import { AuthenticateConfig } from '../../../../interface';

export type GetKeyWithVendorPrefix = (config: AuthenticateConfig, key: string) => string;

export const getKeyWithVendorPrefix: GetKeyWithVendorPrefix = ({ vendorKey }, key) => `X-${vendorKey}-${key}`;
