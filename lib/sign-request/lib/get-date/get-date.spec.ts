import { getDate } from './get-date';

describe('GetDate', () => {
  it('should return with current date', () => {
    const currentDate = new Date(5);
    const clock = jasmine.clock();
    clock.install();
    clock.mockDate(currentDate);

    const result = getDate();

    expect(result).toEqual(currentDate);
    clock.uninstall();
  });
});
