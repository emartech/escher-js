import { getHeadersToSign } from './get-headers-to-sign';
import { createSignRequestConfg } from '../../../../factory';
import { v4 } from 'uuid';

describe('Get Headers To Sign', () => {
  it('should return "host"', () => {
    const result = getHeadersToSign(createSignRequestConfg());

    expect(result).toContain('host');
  });

  it('should return date header from config', () => {
    const dateHeaderName = 'date-header-name';

    const result = getHeadersToSign(createSignRequestConfg({ dateHeaderName }));

    expect(result).toContain('date-header-name');
  });

  describe('date header is not lower case', () => {
    it('should return lowercase date header from config', () => {
      const dateHeaderName = 'Date-Header-Name';

      const result = getHeadersToSign(createSignRequestConfg({ dateHeaderName }));

      expect(result).toContain('date-header-name');
    });
  });

  it('should return with additional headers', () => {
    const additionalHeaders = [v4(), v4()];

    const [, , ...rest] = getHeadersToSign(createSignRequestConfg(), additionalHeaders);

    expect(rest).toEqual(additionalHeaders);
  });
});
