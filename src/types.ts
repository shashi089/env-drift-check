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
  /** Environment name where this boolean must be false (e.g. "production"). */
  mustBeFalseIn?: string;
  /** Environment name where this boolean must be true (e.g. "production"). */
  mustBeTrueIn?: string;
  /** Whether the variable is mandatory. Defaults to true. */
  required?: boolean;
  /**
   * Makes this key required only when another key has a specific value.
   * Example: { "AUTH_TYPE": "oauth" } means this key is required when AUTH_TYPE === "oauth".
   */
  requiredIf?: Record<string, string>;
  /** Default value used when the key is absent. Prevents the key from appearing in 'missing'. */
  default?: string;
  /** If true, runs entropy checks to ensure passwords or keys are not weak. */
  checkSecretStrength?: boolean;
  /** Marks the key as deprecated. If true, prints a warning. Can also be a migration message string. */
  deprecated?: boolean | string;
}

/**
 * Global configuration for the env-drift-check tool.
 */
export interface Config {
  /** The template environment file to compare against (e.g., .env.example). */
  baseEnv?: string;
  /** A map of environment variable keys to their validation rules. */
  rules?: Record<string, Rule>;
  /** Whether to fall back to process.env during checks. */
  includeSystemEnv?: boolean;
  /**
   * Framework hint for prefix-awareness warnings.
   * "auto" (default) detects from package.json; set explicitly to disable or override.
   */
  framework?: "nextjs" | "vite" | "cra" | "auto" | "none";
  /** Path to a base config file to inherit from. Rules are deep-merged; child wins on conflict. */
  extends?: string;
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
