export type IsEqualFixedTime = (a: string, b: string) => boolean;
export type IsEqual = (a: NodeJS.ArrayBufferView, b: NodeJS.ArrayBufferView) => boolean;

export const createIsEqualFixedTime = (isEqual: IsEqual): IsEqualFixedTime => (a, b) => {
  try {
    return isEqual(Buffer.from(a), Buffer.from(b));
  } catch (err) {
    return false;
  }
};
