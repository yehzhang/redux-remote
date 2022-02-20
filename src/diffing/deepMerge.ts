import forOwn from 'lodash/forOwn';
import isRecord from '../data/isRecord';
import Diff, { diffDeleted, diffUndefined, diffValueType } from './Diff';
import isPrimitiveValue from './isPrimitiveValue';

function deepMerge(base: unknown, diff: Diff): unknown {
  if (diff === diffUndefined) {
    return undefined;
  }

  if (isPrimitiveValue(diff)) {
    return diff;
  }

  if (diff[diffValueType] === 'array') {
    const mergeableBase = (Array.isArray(base) ? base : []).slice(
      0,
      typeof diff.length === 'number' ? diff.length : undefined
    );
    forOwn(diff, (value, key) => {
      const index = Number(key);
      if (!isNaN(index)) {
        deepMergeObjectOrArrayMember(mergeableBase, index, value);
      }
    });
    return mergeableBase;
  }

  // Assumes `diff` to be a `DiffRecord`.
  const mergeableBase = isRecord(base) ? { ...base } : {};
  forOwn(
    diff,
    (value, key) => void deepMergeObjectOrArrayMember(mergeableBase, key, value)
  );
  return mergeableBase;
}

function deepMergeObjectOrArrayMember(
  base: Record<keyof any, unknown>,
  key: string,
  diff: Diff
): void;
function deepMergeObjectOrArrayMember(
  base: unknown[],
  index: number,
  diff: Diff
): void;
function deepMergeObjectOrArrayMember(
  base: Record<keyof any, unknown> | unknown[],
  key: any,
  diff: Diff
) {
  if (diff === diffDeleted) {
    delete base[key];
    return;
  }
  base[key] = deepMerge(base[key], diff);
}

export default deepMerge;
