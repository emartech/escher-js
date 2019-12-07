import { Escher } from './escher';

describe('Escher', () => {
  describe('invalid config', () => {
    it('should throw error', () => {
      const config = { vendorKey: 1 };
      expect(() => new Escher(config)).toThrow(new Error('Vendor key should be an uppercase string'));
    });
  });
});
