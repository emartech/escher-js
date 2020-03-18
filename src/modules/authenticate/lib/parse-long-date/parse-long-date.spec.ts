import { parseLongDate } from './parse-long-date';

describe('Parse Long Date', () => {
  it('should throw error when input long date is invalid', () => {
    const longDate = 'invalid long date';
    expect(() => parseLongDate(longDate)).toThrow(
      new Error('Invalid date header, expected format is: 20151104T092022Z'),
    );
  });

  it('should throw error when input long date is invalid', () => {
    const longDate = '20151104T092022Z';
    const result = parseLongDate(longDate);
    expect(result.toISOString()).toEqual('2015-11-04T09:20:22.000Z');
  });
});
