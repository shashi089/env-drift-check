export interface Rule {
  type: "string" | "number" | "boolean" | "enum" | "email" | "url" | "regex";
  values?: string[]; // for enum
  regex?: string; // for custom regex
  min?: number; // min length (string) or value (number)
  max?: number; // max length (string) or value (number)
  description?: string; // for interactive prompt
  mustBeFalseIn?: string; // for boolean logic (legacy support)
  required?: boolean; // defaults to true
}

export interface Config {
  baseEnv?: string;
  rules?: Record<string, Rule>;
}

export interface ValueMismatch {
  key: string;
  expected: string;
  actual: string;
}

export interface DriftResult {
  missing: string[];
  extra: string[];
  errors: { key: string; message: string }[]; // Changed from string[] to object for better reporting
  warnings: string[];
  mismatches: ValueMismatch[];
}
