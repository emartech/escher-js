import { EscherConfig } from '../../../../interface';

export type GetKeyWithVendorPrefix = (config: EscherConfig, key: string) => string;

export const getKeyWithVendorPrefix: GetKeyWithVendorPrefix = ({ vendorKey }, key) => `X-${vendorKey}-${key}`;
