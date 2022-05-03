import { timingSafeEqual } from 'crypto';
import { createIsEqualFixedTime } from './is-equal-fixed-time';

export const isEqualFixedTime = createIsEqualFixedTime(timingSafeEqual);
