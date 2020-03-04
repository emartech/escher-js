import { getKeyWithVendorPrefix } from './get-key-with-vendor-prefix';
import { createAuthenticateConfig } from '../../../../factory';
import { v4 } from 'uuid';

describe('Get Key With Vendor Prefix', () => {
  it('should', () => {
    const key = v4();
    const vendorKey = v4();
    const config = createAuthenticateConfig({ vendorKey });
    const result = getKeyWithVendorPrefix(config, key);

    expect(result).toEqual(`X-${vendorKey}-${key}`);
  });
});
