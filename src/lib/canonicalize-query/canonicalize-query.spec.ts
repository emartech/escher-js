import { canonicalizeQuery } from './canonicalize-query';

describe('Canonicalize Query', () => {
  [
    {
      should: 'return empty string when empty query given',
      query: {},
      expected: '',
    },
    {
      should: 'return one key with value',
      query: { key: 'value' },
      expected: 'key=value',
    },
    {
      should: 'return one key with value',
      query: { first: 'first_value', second: 'second_value' },
      expected: 'first=first_value&second=second_value',
    },
    {
      should: 'return sorted keys',
      query: { b: 'first_value', a: 'second_value', d: 'third_value' },
      expected: 'a=second_value&b=first_value&d=third_value',
    },
    {
      should: 'return value of a key with list value',
      query: { b: ['first_value'] },
      expected: 'b=first_value',
    },
    {
      should: 'return values of a key',
      query: { b: ['first_value', 'second_value'] },
      expected: 'b=first_value&b=second_value',
    },
    {
      should: 'return sorted values of a key with multiple values',
      query: { b: ['b_value', 'a_value'] },
      expected: 'b=a_value&b=b_value',
    },
    {
      should: `return convert ' letter in key`,
      query: { [`a'key`]: 'value' },
      expected: 'a%27key=value',
    },
    {
      should: `return convert ' letter in value`,
      query: { key: `a'value` },
      expected: 'key=a%27value',
    },
    {
      should: 'return convert ( letter in key',
      query: { 'a(key': 'value' },
      expected: 'a%28key=value',
    },
    {
      should: 'return convert ( letter in value',
      query: { key: 'a(value' },
      expected: 'key=a%28value',
    },
    {
      should: 'return convert ) letter in key',
      query: { 'a)key': 'value' },
      expected: 'a%29key=value',
    },
    {
      should: 'return convert ) letter in value',
      query: { key: 'a)value' },
      expected: 'key=a%29value',
    },
    {
      should: 'encode key',
      query: { 'x=test': 'value' },
      expected: 'x%3Dtest=value',
    },
    {
      should: 'encode value',
      query: { key: 'x=test' },
      expected: 'key=x%3Dtest',
    },
  ].forEach(testCase => {
    it(`should ${testCase.should}`, () => {
      const result = canonicalizeQuery(testCase.query as any);
      expect(result).toEqual(testCase.expected);
    });
  });
});
