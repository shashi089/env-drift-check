import { DriftResult, Config } from "../types";
import { validateValue } from "./validator";

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

  // Missing & extra keys
  for (const key of Object.keys(base)) {
    if (!(key in target)) result.missing.push(key);
  }

  for (const key of Object.keys(target)) {
    if (!(key in base)) result.extra.push(key);
  }

  // Value mismatch detection
  for (const key of Object.keys(base)) {
    if (key in target && base[key] !== target[key]) {
      result.mismatches.push({
        key,
        expected: base[key],
        actual: target[key]
      });
    }
  }

  // Rule-based validation
  for (const [key, rule] of Object.entries(config.rules)) {
    if (target[key]) {
      const err = validateValue(
        key,
        target[key],
        rule,
        target["NODE_ENV"]
      );
      if (err) result.errors.push(err);
    }
  }

  return result;
}
