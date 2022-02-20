import forOwn from 'lodash/forOwn';
import Diff, {
  DiffArray,
  diffDeleted,
  DiffRecord,
  diffUndefined,
  diffValueType,
} from '../diffing/Diff';
import isRecord from '../data/isRecord';
import isPrimitiveValue from './isPrimitiveValue';

// Undefined indicates no diff.
function deepDiff(lhs: unknown, rhs: unknown): Diff | undefined {
  if (lhs === rhs) {
    return undefined;
  }

  if (isPrimitiveValue(rhs)) {
    return rhs;
  }

  if (Array.isArray(rhs)) {
    const diff: DiffArray = {
      [diffValueType]: 'array',
    };

    if (!Array.isArray(lhs)) {
      deepDiffRecordsOrArrays([], rhs, diff);
      // Returns the diff even when empty because rhs may be an empty array.
      return diff;
    }

    if (rhs.length < lhs.length) {
      diff.length = rhs.length;
    }

    // Ignores removed elements on lhs because length already indicates those.
    const slicedLhs = lhs.length < rhs.length ? lhs : lhs.slice(0, rhs.length);
    return deepDiffRecordsOrArrays(slicedLhs, rhs, diff) ? diff : undefined;
  }

  if (isRecord(rhs)) {
    const diff: DiffRecord = {};
    if (!isRecord(lhs)) {
      deepDiffRecordsOrArrays({}, rhs, diff);
      // Returns the diff even when empty because rhs may be an empty object.
      return diff;
    }
    return deepDiffRecordsOrArrays(lhs, rhs, diff) ? diff : undefined;
  }

  // Converts unsupported types to undefined to avoid unnecessary diff objects.
  return diffUndefined;
}

// Returns whether the values have diffs.
function deepDiffRecordsOrArrays(
  lhs: Record<keyof any, unknown>,
  rhs: Record<keyof any, unknown>,
  diff: DiffRecord
): boolean;
function deepDiffRecordsOrArrays(
  lhs: unknown[],
  rhs: unknown[],
  diff: DiffArray
): boolean;
function deepDiffRecordsOrArrays(
  lhs: Record<keyof any, unknown> | unknown[],
  rhs: Record<keyof any, unknown> | unknown[],
  diff: DiffRecord | DiffArray
): boolean {
  let hasDiff = false;

  // Diffs removed properties.
  forOwn(lhs, (lhsValue, key: keyof any) => {
    // Keys like symbols are not supported.
    if (typeof key === 'string' && !rhs.hasOwnProperty(key)) {
      diff[key] = diffDeleted;
      hasDiff = true;
      return;
    }
  });

  // Diffs added and updated properties.
  forOwn(rhs, (rhsValue, key: keyof any) => {
    if (typeof key !== 'string' || diff.hasOwnProperty(key)) {
      return;
    }

    // Corner case: rhs adds an undefined property.
    // The common case assumes lhs to be undefined which results in no diff.
    if (!lhs.hasOwnProperty(key) && rhsValue === undefined) {
      diff[key] = diffUndefined;
      hasDiff = true;
    }

    const childDiff = deepDiff(lhs[key as any], rhsValue);
    if (childDiff !== undefined) {
      diff[key] = childDiff;
      hasDiff = true;
    }
  });

  return hasDiff;
}

export default deepDiff;
