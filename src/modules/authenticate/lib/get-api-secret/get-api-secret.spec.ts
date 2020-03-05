import { v4 } from 'uuid';
import { getApiSecret } from './get-api-secret';

describe('Get Api Secret', () => {
  it('should calls keyDB with acces key id from credentials', () => {
    const accessKeyId = v4();
    const credentials = `${accessKeyId}/11111111/${v4()}`;
    const keyDB = jasmine.createSpy('keyDB');
    getApiSecret(credentials, keyDB);
    expect(keyDB).toHaveBeenCalledWith(accessKeyId);
  });

  it('should returns result of keyDB', () => {
    const apiSecret = v4();
    const keyDB = () => apiSecret;
    const result = getApiSecret(v4(), keyDB);
    expect(result).toEqual(apiSecret);
  });
});
