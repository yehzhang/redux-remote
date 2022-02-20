import isPlainObject from 'lodash/isPlainObject';

function isRecord(
  value: unknown
): value is Readonly<Record<keyof any, unknown>> {
  return isPlainObject(value);
}

export default isRecord;
