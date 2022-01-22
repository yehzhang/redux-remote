function parseJsonObject<T extends object>(
  text: string
): DeepPartial<T> | null {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  if (!data || typeof data !== 'object') {
    return null;
  }

  return data;
}

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export default parseJsonObject;
