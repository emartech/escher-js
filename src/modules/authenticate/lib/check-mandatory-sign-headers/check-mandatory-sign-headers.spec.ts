import { checkMandatorySignHeaders } from './check-mandatory-sign-headers';

describe('Check Mandatory Sign Headers', () => {
  it('should throw error even when host in not included in mandatory headers', () => {
    const signedHeaders: string[] = [];
    const mandatorySignedHeaders: string[] = [];

    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).toThrow(new Error('The host header is not signed'));
  });

  it('should not throw error when signed headers contains the host', () => {
    const signedHeaders: string[] = ['host'];
    const mandatorySignedHeaders: string[] = [];
    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).not.toThrow();
  });

  it('should throw error when mandatory signed headers is not signed', () => {
    const signedHeaders: string[] = [];
    const mandatorySignedHeaders: string[] = ['test-header'];

    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).toThrow(new Error('The test-header header is not signed'));
  });

  it('should not throw error when signed headers contains the host', () => {
    const signedHeaders: string[] = ['host', 'signed-header'];
    const mandatorySignedHeaders: string[] = ['signed-header'];
    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).not.toThrow();
  });

  it('should normalize mandatory signed header names before comparison', () => {
    const signedHeaders: string[] = ['host', 'signed-header'];
    const mandatorySignedHeaders: string[] = ['Host ', ' SIGNED-HEADER '];
    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).not.toThrow();
  });

  it('should normalize signed header names before comparison', () => {
    const signedHeaders: string[] = ['Host ', ' SIGNED-HEADER '];
    const mandatorySignedHeaders: string[] = ['signed-header'];
    expect(() => checkMandatorySignHeaders(signedHeaders, mandatorySignedHeaders)).not.toThrow();
  });
});
