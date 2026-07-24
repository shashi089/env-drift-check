export interface Rule {
  type: "string" | "number" | "boolean" | "enum" | "email" | "url" | "regex";
  values?: string[];
  regex?: string;
  min?: number; // length for strings, numeric value for numbers
  max?: number;
  description?: string;
  mustBeFalseIn?: string;
  mustBeTrueIn?: string;
  required?: boolean;
  requiredIf?: Record<string, string>;
  default?: string;
  checkSecretStrength?: boolean;
  deprecated?: boolean | string;
}

export interface Config {
  baseEnv?: string;
  rules?: Record<string, Rule>;
  includeSystemEnv?: boolean;
  framework?: "nextjs" | "vite" | "cra" | "auto" | "none";
  extends?: string; // deep-merged with parent; child rules win on conflict
}

export interface ValueMismatch {
  key: string;
  expected: string;
  actual: string;
}

export interface DriftResult {
  missing: string[];
  extra: string[];
  errors: { key: string; message: string }[];
  warnings: string[];
  mismatches: ValueMismatch[];
}
