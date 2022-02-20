function isPrimitiveValue(
  value: unknown
): value is number | boolean | string | null {
  return (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'string' ||
    value === null
  );
}

export default isPrimitiveValue;
