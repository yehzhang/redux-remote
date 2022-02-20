import { Action } from 'redux';
import isRecord from './isRecord';

function isAction(
  value: unknown
): value is Action & Readonly<Record<keyof any, unknown>> {
  return isRecord(value) && 'type' in value;
}

export default isAction;
