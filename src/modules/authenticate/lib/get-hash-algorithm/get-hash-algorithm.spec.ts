import { getHashAlgorithm } from './get-hash-algorithm';

describe('Get Hash Algorithm', () => {
  it('should return last part of algorithm', () => {
    const hashAlgo = '[X]';
    const algorithm = `first-second-${hashAlgo}`;
    const result = getHashAlgorithm(algorithm);
    expect(result).toEqual(hashAlgo);
  });
});
