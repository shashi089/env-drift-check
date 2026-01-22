export type Rule =
  | { type: "number" }
  | { type: "boolean"; mustBeFalseIn?: string }
  | { type: "enum"; values: string[] };

export interface Config {
  baseEnv: string;
  rules: Record<string, Rule>;
}

export interface ValueMismatch {
  key: string;
  expected: string;
  actual: string;
}

export interface DriftResult {
  missing: string[];
  extra: string[];
  errors: string[];
  warnings: string[];
  mismatches: ValueMismatch[];
}
