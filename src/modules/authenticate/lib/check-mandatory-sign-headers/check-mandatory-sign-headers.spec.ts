import { checkMandatorySignHeaders } from './check-mandatory-sign-headers';

describe('Check Mandatory Sign Headers', () => {
  it('should throw error when mandatory signed headers is not signed', () => {
    const signedHeaders: string[] = [];
    const mandatorySignedHeaders: string[] = ['test-header'];

    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).toThrow(new Error('The test-header header is not signed'));
  });

  it('should not throw error when signed headers contains mandatory header', () => {
    const signedHeaders: string[] = ['signed-header'];
    const mandatorySignedHeaders: string[] = ['signed-header'];
    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).not.toThrow();
  });

  it('should normalize mandatory signed header names before comparison', () => {
    const signedHeaders: string[] = ['signed-header'];
    const mandatorySignedHeaders: string[] = [' SIGNED-HEADER '];
    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).not.toThrow();
  });

  it('should normalize signed header names before comparison', () => {
    const signedHeaders: string[] = [' SIGNED-HEADER '];
    const mandatorySignedHeaders: string[] = ['signed-header'];
    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).not.toThrow();
  });
});
