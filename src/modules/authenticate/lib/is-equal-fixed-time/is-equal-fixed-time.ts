import { timingSafeEqual } from 'crypto';

export type IsEqualFixedTime = (a: string, b: string) => boolean;

export const isEqualFixedTime: IsEqualFixedTime = (a, b) => {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch (err) {
    return false;
  }
};
