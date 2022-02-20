export const diffValueType = '@@_remote/DIFF@__';

type Diff =
  | number
  | string
  | boolean
  | null
  | DiffRecord
  | DiffArray
  // Supports undefined values in JSON.
  | typeof diffUndefined;

export type DiffRecord = {
  readonly [diffValueType]?: 'object';
} & {
  [key: string]: Diff | typeof diffDeleted;
};

export type DiffArray = {
  readonly [diffValueType]: 'array';
  length?: number;
} & {
  [index: string]: Diff | typeof diffDeleted;
};

export const diffUndefined = `${diffValueType}/undefined` as const;

export const diffDeleted = `${diffValueType}/deleted` as const;

export default Diff;
