import { getCredential, CredentialConfig } from './get-credential';
import { v4 } from 'uuid';

describe('Get Credential', () => {
  it('should create credential', () => {
    const config = createCredentialConfig();
    const date = new Date(0);

    const result = getCredential(config, date);

    expect(result).toEqual(`${config.accessKeyId}/19700101/${config.credentialScope}`);
  });
});

function createCredentialConfig({
  accessKeyId = v4(),
  credentialScope = v4(),
}: Partial<CredentialConfig> = {}): CredentialConfig {
  return { credentialScope, accessKeyId };
}
