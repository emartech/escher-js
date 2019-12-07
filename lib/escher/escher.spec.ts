import { Escher } from './escher';

describe('Escher', () => {
  describe('invalid config', () => {
    it('should throw error', () => {
      const config = { vendorKey: 1 };
      expect(() => new Escher(config)).toThrow(new Error('Vendor key should be an uppercase string'));
    });
  });

  describe('#validateMandatorySignedHeaders', () => {
    it('should throw error when one of headers is not string', () => {
      const headers = [1];
      expect(() => new Escher().validateMandatorySignedHeaders(headers)).toThrow(
        new Error('The mandatorySignedHeaders parameter must be undefined or array of strings')
      );
    });
  });
});
