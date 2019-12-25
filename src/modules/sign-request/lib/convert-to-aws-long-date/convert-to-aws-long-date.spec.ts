import { convertToAwsLongDate } from './convert-to-aws-long-date';

describe('Convert To Aws Long Date', () => {
  it('should convert the given date to aws long date', () => {
    const date = new Date(0);

    const result = convertToAwsLongDate(date);

    expect(result).toEqual('19700101T000000Z');
  });
});
