/**
 * Represents a validation rule for an environment variable.
 */
export interface Rule {
  /** The data type of the variable. Used for validation and CLI input prompts. */
  type: "string" | "number" | "boolean" | "enum" | "email" | "url" | "regex";
  /** Allowed values if the type is 'enum'. */
  values?: string[];
  /** Custom regular expression string if the type is 'regex'. */
  regex?: string;
  /** Minimum length (for strings) or minimum value (for numbers). */
  min?: number;
  /** Maximum length (for strings) or maximum value (for numbers). */
  max?: number;
  /** A helpful description displayed during interactive CLI setup. */
  description?: string;
  /** Environment(s) where this boolean must be false (useful for safety flags). */
  mustBeFalseIn?: string;
  /** Whether the variable is mandatory. Defaults to true. */
  required?: boolean;
}

/**
 * Global configuration for the env-drift-check tool.
 */
export interface Config {
  /** The template environment file to compare against (e.g., .env.example). */
  baseEnv?: string;
  /** A map of environment variable keys to their validation rules. */
  rules?: Record<string, Rule>;
}

/**
 * Details of a mismatch between the base and target environment values.
 */
export interface ValueMismatch {
  key: string;
  expected: string;
  actual: string;
}

/**
 * The consolidated result of an environment drift check.
 */
export interface DriftResult {
  /** Keys present in the template but missing in the target. */
  missing: string[];
  /** Keys present in the target but absent from the template. */
  extra: string[];
  /** Validation errors based on the defined rules. */
  errors: { key: string; message: string }[];
  /** Non-critical warnings. */
  warnings: string[];
  /** Values that differ between the template and target for the same key. */
  mismatches: ValueMismatch[];
}
