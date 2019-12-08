import { Escher } from './escher';
import { createRequest } from '../factory';

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
        new Error('The mandatorySignedHeaders parameter must be undefined or array of strings'),
      );
    });
  });

  describe('#validateRequest', () => {
    it('should throw error when request method is invalid', () => {
      const request = createRequest({ method: 'invalid method' });
      expect(() => new Escher().validateRequest(request)).toThrow(new Error('The request method is invalid'));
    });
  });
});
