import isRecord from './isRecord';
import { JsonObject } from './Json';

function parseJsonObject(text: string): Readonly<JsonObject> | null {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  if (!isRecord(data)) {
    return null;
  }

  return data as JsonObject;
}

export default parseJsonObject;
