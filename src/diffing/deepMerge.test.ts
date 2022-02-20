import deepMerge from './deepMerge';
import { diffDeleted, diffUndefined, diffValueType } from './Diff';

describe('deepMerge', () => {
  it('merges primitive values', () => {
    expect(deepMerge(1, 2)).toBe(2);
    expect(deepMerge(undefined, null)).toBeNull();
    expect(deepMerge(true, true)).toBe(true);
  });

  it('merges undefined', () => {
    expect(deepMerge(1, diffUndefined)).toBeUndefined();
  });

  it('merges arrays', () => {
    expect(
      deepMerge([1], { [diffValueType]: 'array', 0: 1, 1: 2, 2: 3 })
    ).toEqual([1, 2, 3]);
    expect(deepMerge([1, 0, 3], { [diffValueType]: 'array', 1: 2 })).toEqual([
      1, 2, 3,
    ]);
    expect(deepMerge([1, 2, 3], { [diffValueType]: 'array' })).toEqual([
      1, 2, 3,
    ]);
  });

  it('merges arrays with lengths', () => {
    expect(
      deepMerge([10, 20, 30, 40], {
        [diffValueType]: 'array',
        0: 1,
        1: 2,
        2: 3,
        length: 3,
      })
    ).toEqual([1, 2, 3]);
  });

  it('merges arrays carrying over empty', () => {
    const base = [10, 20, 30];
    delete base[1];
    const expected = [1, 2, 3];
    delete expected[1];
    expect(
      deepMerge(base, {
        [diffValueType]: 'array',
        0: 1,
        2: 3,
      })
    ).toEqual(expected);
  });

  it('merges arrays overwriting empty', () => {
    const base = [10, 20, 30];
    delete base[1];
    expect(
      deepMerge(base, {
        [diffValueType]: 'array',
        1: 2,
        2: 3,
      })
    ).toEqual([10, 2, 3]);
  });

  it('merges arrays with new empty', () => {
    const expected = [1, 2, 3];
    delete expected[1];
    expect(
      deepMerge([10, 20, 30], {
        [diffValueType]: 'array',
        0: 1,
        1: diffDeleted,
        2: 3,
      })
    ).toEqual(expected);
  });

  it('merges empty records', () => {
    expect(deepMerge({}, {})).toEqual({});
    expect(deepMerge({ a: 1 }, {})).toEqual({ a: 1 });
    expect(deepMerge({}, { a: 1 })).toEqual({ a: 1 });
  });

  it('merges nested records', () => {
    expect(deepMerge({ a: 1 }, { a: {} })).toEqual({ a: {} });
  });

  it('merges properties in nested records', () => {
    expect(deepMerge({ a: { b: 1 } }, { a: { c: 2 } })).toEqual({
      a: { b: 1, c: 2 },
    });
  });

  it('merges properties in nested records', () => {
    expect(
      deepMerge(
        { a: { b: 1 }, d: undefined, f: undefined, g: null, h: 1 },
        { a: { c: 2 }, e: diffUndefined, h: null }
      )
    ).toEqual({
      a: { b: 1, c: 2 },
      d: undefined,
      e: undefined,
      f: undefined,
      g: null,
      h: null,
    });
  });

  it('merges records with removed properties', () => {
    expect(
      deepMerge(
        { a: { b: 1, c: 2, d: 3 }, d: undefined, e: 1, h: null },
        {
          a: { b: diffDeleted, c: 4 },
          d: diffDeleted,
          e: diffDeleted,
          f: diffDeleted,
          g: { a: diffDeleted },
          h: diffDeleted,
        }
      )
    ).toEqual({
      a: { c: 4, d: 3 },
      g: {},
    });
  });

  it('merges different types', () => {
    expect(deepMerge(1, null)).toBeNull();
    expect(deepMerge(null, true)).toBe(true);
    expect(deepMerge(true, { [diffValueType]: 'array' })).toEqual([]);
    expect(deepMerge({}, { [diffValueType]: 'array' })).toEqual([]);
    expect(deepMerge([], {})).toEqual({});
    expect(deepMerge({}, '')).toBe('');
    expect(deepMerge('', 1)).toBe(1);
  });
});
