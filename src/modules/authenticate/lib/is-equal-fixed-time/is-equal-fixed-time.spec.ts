import { createIsEqualFixedTime } from './is-equal-fixed-time';
import { v4 } from 'uuid';

describe('Is Equal Fixed Time', () => {
  it('should return comparsion result', () => {
    const comparsionResult = true;
    const result = createIsEqualFixedTime(() => comparsionResult)(v4(), v4());
    expect(result).toEqual(comparsionResult);
  });

  it('should return false when compare function throw result', () => {
    const result = createIsEqualFixedTime(() => {
      throw new Error();
    })(v4(), v4());
    expect(result).toEqual(false);
  });

  it('should call compare function with inputs buffer', () => {
    const isEqual = jasmine.createSpy('isEqual');
    createIsEqualFixedTime(isEqual)('[X]', '[Y]');
    expect(isEqual).toHaveBeenCalledWith(Buffer.from('[X]'), Buffer.from('[Y]'));
  });
});
