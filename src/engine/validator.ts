import { Rule } from "../types";

function shannonEntropy(str: string): number {
  const freq = new Map<string, number>();
  for (const c of str) freq.set(c, (freq.get(c) ?? 0) + 1);
  return -[...freq.values()]
    .map(f => f / str.length)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
}

function validateSecret(key: string, value: string, rule: Rule, env: string): string | null {
  const isSecretKey = key.toLowerCase().includes("password") || key.toLowerCase().includes("secret");
  if (!rule.checkSecretStrength && !(rule.checkSecretStrength !== false && isSecretKey)) return null;

  // Length check runs first — a short secret in production is always wrong,
  // and strings < 8 chars can never reach entropy ≥ 3.0 anyway.
  if (env === "production" && value.length < 8) {
    return `${key} must be at least 8 characters long in production`;
  }

  const entropy = shannonEntropy(value);
  if (entropy < 3) {
    return `${key} has low entropy (score: ${entropy.toFixed(1)}/5.0) — use a stronger secret (e.g. openssl rand -base64 32)`;
  }

  return null;
}

function validateNumber(key: string, value: string, rule: Rule): string | null {
  const num = Number(value);
  if (Number.isNaN(num)) return `${key} must be a number`;
  if (rule.min !== undefined && num < rule.min) return `${key} must be at least ${rule.min}`;
  if (rule.max !== undefined && num > rule.max) return `${key} must be at most ${rule.max}`;
  return null;
}

function validateString(key: string, value: string, rule: Rule): string | null {
  if (rule.min !== undefined && value.length < rule.min) return `${key} must be at least ${rule.min} chars`;
  if (rule.max !== undefined && value.length > rule.max) return `${key} must be at most ${rule.max} chars`;
  return null;
}

function validateBoolean(key: string, value: string, rule: Rule, env: string): string | null {
  if (value !== "true" && value !== "false") return `${key} must be true or false`;
  if (rule.mustBeFalseIn === env && value === "true") return `${key} must be false in ${env}`;
  return null;
}

function validateUrl(key: string, value: string): string | null {
  try {
    new URL(value);
    return null;
  } catch {
    return `${key} must be a valid URL`;
  }
}

function validateEnum(key: string, value: string, rule: Rule): string | null {
  if (rule.values && !rule.values.includes(value)) {
    return `${key} must be one of: ${rule.values.join(", ")}`;
  }
  return null;
}

function validateEmail(key: string, value: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value) ? null : `${key} must be a valid email`;
}

function validateRegex(key: string, value: string, rule: Rule): string | null {
  if (rule.regex && !new RegExp(rule.regex).test(value)) {
    return `${key} does not match required pattern`;
  }
  return null;
}

const TYPE_VALIDATORS: Record<string, (key: string, value: string, rule: Rule, env: string) => string | null> = {
  number:  (key, value, rule)       => validateNumber(key, value, rule),
  string:  (key, value, rule)       => validateString(key, value, rule),
  boolean: (key, value, rule, env)  => validateBoolean(key, value, rule, env),
  url:     (key, value)             => validateUrl(key, value),
  enum:    (key, value, rule)       => validateEnum(key, value, rule),
  email:   (key, value)             => validateEmail(key, value),
  regex:   (key, value, rule)       => validateRegex(key, value, rule),
};

/**
 * Validates a single environment variable value against a set of rules.
 * Supports string length, number ranges, boolean flags, enums, emails, URLs, and custom regex.
 *
 * @param key - The name of the environment variable
 * @param value - The value to validate
 * @param rule - The validation rule configuration for this key
 * @param env - The current environment (e.g., NODE_ENV) for conditional rules
 * @returns A string containing the error message if validation fails, otherwise null
 */
export function validateValue(
  key: string,
  value: string,
  rule: Rule,
  env: string
): string | null {
  if (rule.required === false && !value) return null;
  if (rule.required !== false && !value) return `${key} is required`;

  const secretErr = validateSecret(key, value, rule, env);
  if (secretErr) return secretErr;

  const typeValidator = TYPE_VALIDATORS[rule.type];
  return typeValidator ? typeValidator(key, value, rule, env) : null;
}
