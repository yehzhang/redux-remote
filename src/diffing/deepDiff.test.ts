import { diffDeleted, diffUndefined, diffValueType } from './Diff';
import deepDiff from './deepDiff';

describe('deepDiff', () => {
  it('diffs same values', () => {
    expect(deepDiff(1, 1)).toBeUndefined();
    expect(deepDiff(undefined, undefined)).toBeUndefined();
    expect(deepDiff([], [])).toBeUndefined();
    expect(deepDiff({}, {})).toBeUndefined();
    expect(deepDiff({ a: { b: {} } }, { a: { b: {} } })).toBeUndefined();
    const a = {};
    expect(deepDiff({ a }, { a })).toBeUndefined();
  });

  it('diffs primitive values', () => {
    expect(deepDiff(1, 2)).toBe(2);
  });

  it('diffs primitive values with different types', () => {
    expect(deepDiff({ a: { b: 1 } }, { a: 1 })).toEqual({ a: 1 });
    expect(deepDiff({ a: [1] }, { a: 1 })).toEqual({ a: 1 });
  });

  it('diffs null', () => {
    expect(deepDiff(null, 1)).toBe(1);
    expect(deepDiff(1, null)).toBeNull();
    expect(deepDiff(null, null)).toBeUndefined();
    expect(deepDiff({ a: null }, { a: 1 })).toEqual({ a: 1 });
    expect(deepDiff({ a: 1 }, { a: null })).toEqual({ a: null });
  });

  it('diffs unsupported types', () => {
    expect(deepDiff(undefined, 1)).toBe(1);
    expect(deepDiff(1, undefined)).toBe(diffUndefined);
    expect(deepDiff({ a: undefined }, { a: 1 })).toEqual({ a: 1 });
    expect(deepDiff({ a: 1 }, { a: undefined })).toEqual({
      a: diffUndefined,
    });
    expect(deepDiff({}, { a: undefined })).toEqual({
      a: diffUndefined,
    });
    expect(deepDiff(undefined, [])).toEqual({ [diffValueType]: 'array' });
    expect(deepDiff([], undefined)).toBe(diffUndefined);
    expect(deepDiff(undefined, {})).toEqual({});
    expect(deepDiff({}, undefined)).toBe(diffUndefined);
    expect(
      deepDiff(
        () => {},
        () => {}
      )
    ).toBe(diffUndefined);
    expect(deepDiff(() => {}, undefined)).toBe(diffUndefined);
    expect(deepDiff(undefined, () => {})).toBe(diffUndefined);
    expect(
      deepDiff({ a: { b: { c: undefined } } }, { a: { b: { c: () => {} } } })
    ).toEqual({ a: { b: { c: diffUndefined } } });
    expect(
      deepDiff({ a: { b: { c: undefined } } }, { a: { b: { c: undefined } } })
    ).toBeUndefined();
  });

  it('diffs empty records', () => {
    expect(deepDiff(1, {})).toEqual({});
    expect(deepDiff({}, 1)).toBe(1);
  });

  it('diffs records', () => {
    expect(deepDiff({ a: 1 }, { a: 2 })).toEqual({ a: 2 });
  });

  it('ignores symbol keys', () => {
    expect(deepDiff({ [Symbol('a')]: 1 }, {})).toBeUndefined();
    expect(deepDiff({}, { [Symbol('a')]: 1 })).toBeUndefined();
  });

  it('diffs added properties', () => {
    expect(deepDiff({}, { a: 1, b: null })).toEqual({ a: 1, b: null });
  });

  it('diffs removed properties', () => {
    expect(deepDiff({ a: 1, b: null, c: undefined, d: 2 }, { d: 2 })).toEqual({
      a: diffDeleted,
      b: diffDeleted,
      c: diffDeleted,
    });
  });

  it('diffs different values when same values are present', () => {
    expect(deepDiff({ a: 1, b: 2 }, { a: 1, b: 3 })).toEqual({ b: 3 });
  });

  it('diffs simple, nested values', () => {
    expect(deepDiff({ a: { b: 1, c: 2 } }, { a: { b: 1, c: 3 } })).toEqual({
      a: { c: 3 },
    });
  });

  it('diffs updated properties in nested objects', () => {
    expect(
      deepDiff(
        { a: { b: 1 }, c: 2, d: { e: 100 } },
        { a: { b: 99 }, c: 3, d: { e: 100 } }
      )
    ).toEqual({ a: { b: 99 }, c: 3 });
  });

  it('diffs updated properties whose values are objects', () => {
    expect(deepDiff({ a: undefined }, { a: { b: 99 }, c: 3 })).toEqual({
      a: { b: 99 },
      c: 3,
    });
  });

  it('diffs removed properties in nested objects', () => {
    expect(
      deepDiff(
        { a: { b: 1 }, c: 2, d: { e: 100 } },
        { a: { b: 1 }, c: 2, d: {} }
      )
    ).toEqual({ d: { e: diffDeleted } });
  });

  it('diffs removed properties whose values are objects', () => {
    expect(deepDiff({ b: { c: 2 } }, {})).toEqual({
      b: diffDeleted,
    });
  });

  it('diffs objects with different types', () => {
    expect(deepDiff({ a: 1 }, { a: { b: 1 } })).toEqual({ a: { b: 1 } });
    expect(deepDiff({ a: [1] }, { a: { b: 1 } })).toEqual({ a: { b: 1 } });
  });

  it('diffs empty arrays', () => {
    expect(deepDiff(1, [])).toEqual({ [diffValueType]: 'array' });
    expect(deepDiff([], 1)).toBe(1);
  });

  it('diffs a single array element', () => {
    expect(deepDiff({ a: [{ b: 1 }] }, { a: [{ b: {} }] })).toEqual({
      a: { [diffValueType]: 'array', 0: { b: {} } },
    });
  });

  it('diffs multiple array elements', () => {
    expect(deepDiff({ a: [1, 0, 2] }, { a: [2, 0, 1] })).toEqual({
      a: { [diffValueType]: 'array', 0: 2, 2: 1 },
    });
  });

  it('diffs added array elements', () => {
    expect(deepDiff({ a: [1, 0] }, { a: [2, 0] })).toEqual({
      a: { [diffValueType]: 'array', 0: 2 },
    });
  });

  it('diffs added and changed array elements', () => {
    expect(deepDiff({ a: [1, 0] }, { a: [2, 0, 1] })).toEqual({
      a: { [diffValueType]: 'array', 0: 2, 2: 1 },
    });
  });

  it('diffs removed array elements', () => {
    expect(deepDiff({ a: [1, 0] }, { a: [2, 0] })).toEqual({
      a: { [diffValueType]: 'array', 0: 2 },
    });
  });

  it('diffs removed and changed array elements', () => {
    expect(deepDiff({ a: [1, 0, 2] }, { a: [2, 0] })).toEqual({
      a: { [diffValueType]: 'array', length: 2, 0: 2 },
    });
  });

  it('diffs empty array elements on lhs', () => {
    const a = [1, 2, 3, 4];
    delete a[1];
    expect(deepDiff({ a }, { a: [2, 3, 4] })).toEqual({
      a: { [diffValueType]: 'array', length: 3, 0: 2, 1: 3, 2: 4 },
    });
  });

  it('diffs empty array elements on rhs', () => {
    const a = [2, 3, 4];
    delete a[1];
    expect(deepDiff({ a: [1, 2, 3, 4] }, { a })).toEqual({
      a: {
        [diffValueType]: 'array',
        length: 3,
        0: 2,
        1: diffDeleted,
        2: 4,
      },
    });
  });

  it('diffs arrays with different types', () => {
    expect(deepDiff({ a: 1 }, { a: [1, undefined] })).toEqual({
      a: {
        [diffValueType]: 'array',
        0: 1,
        1: diffUndefined,
      },
    });
    expect(deepDiff({ a: { b: 1 } }, { a: [1, undefined] })).toEqual({
      a: {
        [diffValueType]: 'array',
        0: 1,
        1: diffUndefined,
      },
    });
  });
});
