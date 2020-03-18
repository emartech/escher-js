import { convertToAwsShortDate } from './convert-to-aws-short-date';

describe('Convert To Aws Short Date', () => {
  it('should convert the given date to aws short date', () => {
    const date = new Date(0);

    const result = convertToAwsShortDate(date);

    expect(result).toEqual('19700101');
  });
});
