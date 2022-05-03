import { checkRequestDate } from './check-request-date';
import { createAuthenticateConfig } from '../../../../factory';

describe('Check Request Date', () => {
  it('should throw error when date and date in credentials are not the same', () => {
    const credentials = 'AKIDEXAMPLE/19000210/escher_request';
    const date = '99990210T011703Z';
    expect(() => checkRequestDate(createAuthenticateConfig(), credentials, date, 0, new Date())).toThrow(
      new Error('Invalid date in authorization header, it should equal with date header'),
    );
  });

  it('should not throw error when date and date in credentials are the same', () => {
    const credentials = 'AKIDEXAMPLE/19780210/escher_request';
    const date = '19780210T011703Z';
    expect(() =>
      checkRequestDate(createAuthenticateConfig(), credentials, date, 1000, new Date('1978 02 10 01:17:03 GMT')),
    ).not.toThrow();
  });

  it('should throw error when date expired', () => {
    const credentials = 'AKIDEXAMPLE/19780210/escher_request';
    const date = '19780210T011703Z';
    const expires = 1000;
    expect(() =>
      checkRequestDate(createAuthenticateConfig(), credentials, date, expires, new Date('1978 02 10 02:17:03 GMT')),
    ).toThrow(new Error('The request date is not within the accepted time range'));
  });

  it('should not throw error when date not expired', () => {
    const credentials = 'AKIDEXAMPLE/19780210/escher_request';
    const date = '19780210T011703Z';
    const expires = 1000;
    expect(() =>
      checkRequestDate(
        createAuthenticateConfig({ clockSkew: 0 }),
        credentials,
        date,
        expires,
        new Date('1978 02 10 01:17:03 GMT'),
      ),
    ).not.toThrow();
  });
});
