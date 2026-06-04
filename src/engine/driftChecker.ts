import { DriftResult, Config } from "../types";
import { validateValue } from "./validator";

/**
 * Compares a base environment (template) against a target environment (actual)
 * and returns the differences including missing keys, extra keys, and value mismatches.
 * 
 * @param base - The record representing the template environment (e.g., .env.example)
 * @param target - The record representing the actual environment (e.g., .env)
 * @param config - Configuration object containing validation rules
 * @returns An object containing the results of the drift check
 */
export function checkDrift(
  base: Record<string, string>,
  target: Record<string, string>,
  config: Config
): DriftResult {
  const result: DriftResult = {
    missing: [],
    extra: [],
    errors: [],
    warnings: [],
    mismatches: []
  };

  const includeSystemEnv = !!config.includeSystemEnv;

  // Missing & extra keys
  for (const key of Object.keys(base)) {
    const exists = (key in target) || (includeSystemEnv && (key in process.env));
    if (!exists) result.missing.push(key);
  }

  for (const key of Object.keys(target)) {
    if (!(key in base)) result.extra.push(key);
  }

  // Value mismatch detection
  for (const key of Object.keys(base)) {
    const hasTarget = key in target;
    const hasSystem = includeSystemEnv && (key in process.env);
    if (hasTarget || hasSystem) {
      const actualValue = hasTarget ? target[key] : process.env[key]!;
      if (base[key] !== actualValue) {
        result.mismatches.push({
          key,
          expected: base[key],
          actual: actualValue
        });
      }
    }
  }

  // Rule-based validation & deprecation warning
  const rules = config.rules || {};
  const currentEnv = target["NODE_ENV"] || process.env["NODE_ENV"] || "development";
  for (const [key, rule] of Object.entries(rules)) {
    const hasTarget = key in target;
    const hasSystem = includeSystemEnv && (key in process.env);
    if (hasTarget || hasSystem) {
      const value = hasTarget ? target[key] : process.env[key]!;
      const err = validateValue(
        key,
        value,
        rule,
        currentEnv
      );
      if (err) result.errors.push({ key, message: err });

      if (rule.deprecated) {
        const msg = typeof rule.deprecated === "string"
          ? rule.deprecated
          : `${key} is deprecated and should be removed.`;
        result.warnings.push(msg);
      }
    }
  }

  return result;
}
